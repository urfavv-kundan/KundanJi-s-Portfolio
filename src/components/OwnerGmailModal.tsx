import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  Mail,
  Send,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  LogOut,
  Users,
  MessageSquare,
  Lock,
  Zap,
  Inbox,
} from 'lucide-react';
import { OWNER_EMAIL } from '../utils/emailMime';

interface SubscriberRecord {
  id: string;
  email: string;
  subscribedAt: string;
  welcomeEmailSent: boolean;
  welcomeEmailSentAt?: string;
  gmailMessageId?: string;
  lastError?: string;
}

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  ownerNotified?: boolean;
  ownerNotifiedAt?: string;
  notificationMessageId?: string;
  notificationError?: string;
  replySent?: boolean;
  replySentAt?: string;
  gmailMessageId?: string;
}

interface PendingConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

interface OwnerGmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerUser: User | null;
  accessToken: string | null;
  isSigningIn: boolean;
  authError: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onTokenExpired: () => void;
  onStatusSync?: (status: {
    autoDispatchEnabled: boolean;
    pendingSubscribers: number;
    pendingContacts: number;
  }) => void;
  refreshTrigger?: number;
}

export const OwnerGmailModal: React.FC<OwnerGmailModalProps> = ({
  isOpen,
  onClose,
  ownerUser,
  accessToken,
  isSigningIn,
  authError,
  onSignIn,
  onSignOut,
  onTokenExpired,
  onStatusSync,
  refreshTrigger = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'contacts'>('subscribers');
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>([]);
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [testEmailInput, setTestEmailInput] = useState(OWNER_EMAIL);
  const [replyTarget, setReplyTarget] = useState<ContactInquiry | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [confirmAction, setConfirmAction] = useState<PendingConfirmAction | null>(null);

  const isOwnerAuthenticated =
    Boolean(ownerUser?.email) &&
    ownerUser!.email!.toLowerCase().trim() === OWNER_EMAIL.toLowerCase();

  const syncCounts = useCallback(
    (
      nextAuto: boolean,
      nextSubs: SubscriberRecord[],
      nextContacts: ContactInquiry[]
    ) => {
      onStatusSync?.({
        autoDispatchEnabled: nextAuto,
        pendingSubscribers: nextSubs.filter((s) => !s.welcomeEmailSent).length,
        pendingContacts: nextContacts.filter((c) => !c.ownerNotified).length,
      });
    },
    [onStatusSync]
  );

  const fetchOverview = useCallback(async () => {
    if (!accessToken || !isOwnerAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/owner/overview', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === 'TOKEN_EXPIRED') {
        setAutoDispatchEnabled(false);
        onTokenExpired();
        setActionBanner({
          type: 'error',
          text: 'Your Gmail OAuth token has expired. Please re-authorize with Google.',
        });
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load owner data.');
      }
      const subs: SubscriberRecord[] = data.subscribers || [];
      const conts: ContactInquiry[] = data.contacts || [];
      const autoOn = Boolean(data.autoDispatchEnabled);
      setSubscribers(subs);
      setContacts(conts);
      setAutoDispatchEnabled(autoOn);
      syncCounts(autoOn, subs, conts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to fetch owner overview.';
      setActionBanner({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isOwnerAuthenticated, onTokenExpired, syncCounts]);

  useEffect(() => {
    if (isOpen && accessToken && isOwnerAuthenticated) {
      fetchOverview();
    }
  }, [isOpen, accessToken, isOwnerAuthenticated, refreshTrigger, fetchOverview]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (confirmAction) {
          setConfirmAction(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmAction, onClose]);

  if (!isOpen) return null;

  const pendingSubscribers = subscribers.filter((s) => !s.welcomeEmailSent);
  const pendingContacts = contacts.filter((c) => !c.ownerNotified);

  const executeToggleAutoDispatch = async (enable: boolean, dispatchPending: boolean) => {
    if (!accessToken) {
      onTokenExpired();
      return;
    }
    setIsDispatching(true);
    setActionBanner(null);
    try {
      const res = await fetch('/api/owner/auto-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          enabled: enable,
          dispatchPending,
          portfolioUrl: window.location.origin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === 'TOKEN_EXPIRED') {
        setAutoDispatchEnabled(false);
        onTokenExpired();
        setActionBanner({
          type: 'error',
          text: data.error || 'Gmail session expired. Please re-authorize with Google.',
        });
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update Auto-Dispatch setting.');
      }
      const nextAuto = Boolean(data.autoDispatchEnabled);
      const nextSubs: SubscriberRecord[] = data.subscribers || subscribers;
      const nextContacts: ContactInquiry[] = data.contacts || contacts;
      setAutoDispatchEnabled(nextAuto);
      setSubscribers(nextSubs);
      setContacts(nextContacts);
      syncCounts(nextAuto, nextSubs, nextContacts);

      if (nextAuto) {
        const extraNote =
          data.sentWelcomeCount > 0 || data.forwardedContactCount > 0
            ? ` Dispatched ${data.sentWelcomeCount} pending welcome email(s) and forwarded ${data.forwardedContactCount} inquiry(s) to ${OWNER_EMAIL}.`
            : '';
        setActionBanner({
          type: 'success',
          text: `Automatic Gmail Dispatch is now ACTIVE! New subscribers and Get In Touch messages will send automatically.${extraNote}`,
        });
      } else {
        setActionBanner({
          type: 'success',
          text: 'Automatic Gmail Dispatch paused. Emails will require manual send.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update Auto-Dispatch.';
      setActionBanner({ type: 'error', text: msg });
    } finally {
      setIsDispatching(false);
    }
  };

  const executeDispatchWelcome = async (payload: {
    subscriberIds?: string[];
    recipientEmail?: string;
  }) => {
    if (!accessToken) {
      onTokenExpired();
      return;
    }
    setIsDispatching(true);
    setActionBanner(null);
    try {
      const res = await fetch('/api/owner/dispatch-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...payload,
          portfolioUrl: window.location.origin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === 'TOKEN_EXPIRED') {
        setAutoDispatchEnabled(false);
        onTokenExpired();
        setActionBanner({
          type: 'error',
          text: data.error || 'Gmail session expired. Please re-authorize with Google.',
        });
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Gmail dispatch failed.');
      }
      const nextSubs: SubscriberRecord[] = Array.isArray(data.subscribers)
        ? data.subscribers
        : subscribers;
      setSubscribers(nextSubs);
      syncCounts(autoDispatchEnabled, nextSubs, contacts);

      if (data.failedCount > 0 && data.sentCount === 0) {
        const firstErr = data.results?.[0]?.error || 'Delivery error from Gmail API.';
        setActionBanner({
          type: 'error',
          text: `Failed to send email: ${firstErr}`,
        });
      } else {
        const msgIdNote = data.messageId ? ` (Message ID: ${data.messageId})` : '';
        setActionBanner({
          type: 'success',
          text: `Successfully sent ${data.sentCount} welcome email(s) via Gmail!${msgIdNote}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected Gmail dispatch error.';
      setActionBanner({ type: 'error', text: msg });
    } finally {
      setIsDispatching(false);
    }
  };

  const executeForwardContacts = async (inquiryIds?: string[]) => {
    if (!accessToken) {
      onTokenExpired();
      return;
    }
    setIsDispatching(true);
    setActionBanner(null);
    try {
      const res = await fetch('/api/owner/forward-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          inquiryIds,
          portfolioUrl: window.location.origin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === 'TOKEN_EXPIRED') {
        setAutoDispatchEnabled(false);
        onTokenExpired();
        setActionBanner({
          type: 'error',
          text: data.error || 'Gmail session expired. Please re-authorize with Google.',
        });
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to forward inquiries to Gmail.');
      }
      const nextContacts: ContactInquiry[] = Array.isArray(data.contacts)
        ? data.contacts
        : contacts;
      setContacts(nextContacts);
      syncCounts(autoDispatchEnabled, subscribers, nextContacts);

      setActionBanner({
        type: data.failedCount > 0 && data.sentCount === 0 ? 'error' : 'success',
        text:
          data.sentCount > 0
            ? `Delivered ${data.sentCount} Get In Touch message(s) straight to ${OWNER_EMAIL}!`
            : 'No inquiries needed forwarding.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to forward inquiries.';
      setActionBanner({ type: 'error', text: msg });
    } finally {
      setIsDispatching(false);
    }
  };

  const executeContactReply = async (inquiry: ContactInquiry, message: string) => {
    if (!accessToken) {
      onTokenExpired();
      return;
    }
    setIsDispatching(true);
    setActionBanner(null);
    try {
      const res = await fetch('/api/owner/reply-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          replyMessage: message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === 'TOKEN_EXPIRED') {
        setAutoDispatchEnabled(false);
        onTokenExpired();
        setActionBanner({
          type: 'error',
          text: data.error || 'Gmail session expired. Please re-authorize with Google.',
        });
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reply via Gmail.');
      }
      if (Array.isArray(data.contacts)) {
        setContacts(data.contacts);
      }
      setReplyTarget(null);
      setReplyDraft('');
      setActionBanner({
        type: 'success',
        text: `Reply sent directly to ${inquiry.email} via Gmail! (ID: ${data.messageId || 'ok'})`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reply.';
      setActionBanner({ type: 'error', text: msg });
    } finally {
      setIsDispatching(false);
    }
  };

  const promptEnableAutoDispatch = () => {
    const pendingNote =
      pendingSubscribers.length > 0 || pendingContacts.length > 0
        ? ` This will also immediately send ${pendingSubscribers.length} pending welcome email(s) and forward ${pendingContacts.length} pending contact message(s) to ${OWNER_EMAIL}.`
        : '';
    setConfirmAction({
      title: 'Enable Automatic Gmail Dispatch',
      description: `Authorize server-side automatic Gmail delivery for your active session? Every new subscriber will automatically receive a welcome email from ${OWNER_EMAIL}, and every Get In Touch message will automatically be delivered to ${OWNER_EMAIL}.${pendingNote}`,
      confirmLabel: 'Confirm & Enable Auto-Send',
      onConfirm: async () => {
        await executeToggleAutoDispatch(true, true);
      },
    });
  };

  const promptBatchDispatch = () => {
    if (pendingSubscribers.length === 0) return;
    setConfirmAction({
      title: 'Confirm Batch Welcome Email Dispatch',
      description: `Send personalized KundanVerse welcome emails from ${OWNER_EMAIL} to ${pendingSubscribers.length} pending subscriber(s)?`,
      confirmLabel: `Send ${pendingSubscribers.length} Email(s)`,
      onConfirm: async () => {
        await executeDispatchWelcome({
          subscriberIds: pendingSubscribers.map((s) => s.id),
        });
      },
    });
  };

  const promptSingleSubscriberSend = (sub: SubscriberRecord) => {
    setConfirmAction({
      title: sub.welcomeEmailSent ? 'Resend Welcome Email' : 'Send Welcome Email',
      description: `Send welcome email from ${OWNER_EMAIL} to ${sub.email}?`,
      confirmLabel: 'Confirm & Send',
      onConfirm: async () => {
        await executeDispatchWelcome({ subscriberIds: [sub.id] });
      },
    });
  };

  const promptTestSend = () => {
    const target = testEmailInput.trim();
    if (!target) return;
    setConfirmAction({
      title: 'Confirm Test Welcome Email',
      description: `Send a test KundanVerse welcome email from ${OWNER_EMAIL} to ${target}?`,
      confirmLabel: 'Send Test Email',
      onConfirm: async () => {
        await executeDispatchWelcome({ recipientEmail: target });
      },
    });
  };

  const promptForwardContacts = (ids?: string[]) => {
    const count = ids ? ids.length : pendingContacts.length;
    if (count === 0) return;
    setConfirmAction({
      title: 'Deliver Messages to Your Gmail Inbox',
      description: `Forward ${count} Get In Touch contact message(s) to ${OWNER_EMAIL} with visitor Reply-To headers?`,
      confirmLabel: `Deliver ${count} Message(s)`,
      onConfirm: async () => {
        await executeForwardContacts(ids);
      },
    });
  };

  const promptContactReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyDraft.trim()) return;
    const inquiry = replyTarget;
    const text = replyDraft.trim();
    setConfirmAction({
      title: 'Confirm Gmail Reply',
      description: `Send your reply from ${OWNER_EMAIL} to ${inquiry.name} (${inquiry.email}) regarding "${inquiry.subject}"?`,
      confirmLabel: 'Send Reply',
      onConfirm: async () => {
        await executeContactReply(inquiry, text);
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmAction) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 text-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div>
              <h3
                id="owner-portal-title"
                className="text-xs uppercase font-semibold tracking-[0.2em] text-white"
              >
                Owner Gmail Automated Dispatch
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Private console · Restricted to {OWNER_EMAIL}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            aria-label="Close Owner Portal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {authError && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {actionBanner && (
            <div
              className={`p-3.5 border text-xs flex items-center gap-2 ${
                actionBanner.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {actionBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{actionBanner.text}</span>
            </div>
          )}

          {/* Authentication Gate / Status */}
          {!isOwnerAuthenticated || !accessToken ? (
            <div className="p-6 sm:p-8 bg-black border border-zinc-800 text-center space-y-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-xs sm:text-sm uppercase tracking-[0.18em] font-semibold text-white">
                  {isOwnerAuthenticated
                    ? 'Gmail Session Authorization Needed'
                    : 'Site Owner Verification Required'}
                </h4>
                <p className="text-xs text-zinc-400 font-light leading-relaxed">
                  {isOwnerAuthenticated
                    ? `Signed in as ${ownerUser?.email}, but a fresh Google Gmail access token is needed to send emails on your behalf.`
                    : `This panel is hidden from public visitors. Sign in with ${OWNER_EMAIL} to view registered subscribers, receive Get In Touch inquiries in Gmail, and enable automatic Gmail dispatch.`}
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 pt-2">
                {/* Official Google Sign-In Button Styling */}
                <button
                  type="button"
                  onClick={onSignIn}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-zinc-100 text-[#1f1f1f] border border-[#747775] rounded-full text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 shadow-sm"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  )}
                  <span>
                    {isSigningIn
                      ? 'Connecting...'
                      : isOwnerAuthenticated
                      ? 'Re-authorize Gmail with Google'
                      : 'Sign in with Google'}
                  </span>
                </button>

                {isOwnerAuthenticated && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Sign out
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Authenticated Owner Console */
            <div className="space-y-5">
              {/* Connected Status Strip */}
              <div className="p-4 bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gmail Connected
                  </span>
                  <span className="text-xs text-zinc-300 font-mono">{ownerUser?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fetchOverview}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono uppercase tracking-wider text-zinc-200 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Automatic Gmail Dispatch Mode Control */}
              <div
                className={`p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  autoDispatchEnabled
                    ? 'bg-emerald-950/20 border-emerald-800/80'
                    : 'bg-zinc-900/50 border-zinc-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap
                      className={`w-4 h-4 ${
                        autoDispatchEnabled ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
                      Automatic Gmail Dispatch
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 border ${
                        autoDispatchEnabled
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {autoDispatchEnabled ? 'Active · Auto-Sending' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                    When active, new subscribers immediately receive a welcome email AND new Get In Touch inquiries automatically forward to{' '}
                    <span className="text-zinc-200 font-mono">{OWNER_EMAIL}</span>.
                  </p>
                </div>

                {autoDispatchEnabled ? (
                  <button
                    type="button"
                    disabled={isDispatching}
                    onClick={() => executeToggleAutoDispatch(false, false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono uppercase tracking-wider text-zinc-200 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Pause Auto-Send
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isDispatching}
                    onClick={promptEnableAutoDispatch}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Enable Auto-Send</span>
                  </button>
                )}
              </div>

              {/* Quick Test Email Sender */}
              <div className="p-4 bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="owner-test-email"
                    className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1"
                  >
                    Send Test Welcome Email
                  </label>
                  <input
                    id="owner-test-email"
                    type="email"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-white px-3 py-2 text-base sm:text-xs text-white outline-none font-mono min-h-[44px] sm:min-h-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={promptTestSend}
                  disabled={isDispatching || !testEmailInput.trim()}
                  className="sm:mt-4 px-4 py-2 min-h-[44px] sm:min-h-0 bg-white text-black hover:bg-zinc-200 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test Email</span>
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('subscribers')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                    activeTab === 'subscribers'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Subscribers ({subscribers.length})</span>
                  {pendingSubscribers.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-black font-bold">
                      {pendingSubscribers.length} pending
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contacts')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                    activeTab === 'contacts'
                      ? 'bg-white text-black font-semibold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Inquiries ({contacts.length})</span>
                  {pendingContacts.length > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-black font-bold">
                      {pendingContacts.length} undelivered
                    </span>
                  )}
                </button>
              </div>

              {/* TAB: SUBSCRIBERS */}
              {activeTab === 'subscribers' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs text-zinc-400 font-light">
                      {pendingSubscribers.length > 0
                        ? `${pendingSubscribers.length} registered subscriber(s) awaiting their welcome email.`
                        : 'All registered subscribers have received their welcome email.'}
                    </p>
                    {pendingSubscribers.length > 0 && (
                      <button
                        type="button"
                        onClick={promptBatchDispatch}
                        disabled={isDispatching}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send All Pending ({pendingSubscribers.length})</span>
                      </button>
                    )}
                  </div>

                  {subscribers.length === 0 ? (
                    <div className="p-8 bg-black border border-zinc-800 text-center text-xs text-zinc-500 font-mono">
                      No subscribers registered yet.
                    </div>
                  ) : (
                    <div className="border border-zinc-800 divide-y divide-zinc-800 bg-black">
                      {subscribers.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-white">{sub.email}</span>
                              {sub.welcomeEmailSent ? (
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400">
                                  Sent
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-400">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500">
                              Registered: {new Date(sub.subscribedAt).toLocaleString()}
                              {sub.welcomeEmailSentAt &&
                                ` · Sent: ${new Date(sub.welcomeEmailSentAt).toLocaleString()}`}
                            </div>
                            {sub.lastError && (
                              <div className="text-[11px] text-rose-400 font-mono">
                                Error: {sub.lastError}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => promptSingleSubscriberSend(sub)}
                            disabled={isDispatching}
                            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono uppercase tracking-wider text-white cursor-pointer disabled:opacity-50 self-start sm:self-center"
                          >
                            {sub.welcomeEmailSent ? 'Resend' : 'Send Welcome Mail'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CONTACT INQUIRIES */}
              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  {pendingContacts.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-950/20 border border-amber-800/60">
                      <p className="text-xs text-amber-200 font-light">
                        {pendingContacts.length} Get In Touch message(s) saved while auto-forward was paused.
                      </p>
                      <button
                        type="button"
                        onClick={() => promptForwardContacts()}
                        disabled={isDispatching}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold uppercase tracking-[0.12em] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Deliver All to My Gmail ({pendingContacts.length})</span>
                      </button>
                    </div>
                  )}

                  {contacts.length === 0 ? (
                    <div className="p-8 bg-black border border-zinc-800 text-center text-xs text-zinc-500 font-mono">
                      No contact messages received yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((inq) => (
                        <div key={inq.id} className="p-4 bg-black border border-zinc-800 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center flex-wrap gap-2 text-xs font-medium text-white">
                                <span>{inq.subject}</span>
                                {inq.ownerNotified ? (
                                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400">
                                    Delivered to Gmail
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-400">
                                    Saved Only
                                  </span>
                                )}
                                {inq.replySent && (
                                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-sky-950 border border-sky-800 text-sky-300">
                                    Replied
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-400 mt-1">
                                From: {inq.name} &lt;{inq.email}&gt; ·{' '}
                                {new Date(inq.createdAt).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              {!inq.ownerNotified && (
                                <button
                                  type="button"
                                  onClick={() => promptForwardContacts([inq.id])}
                                  disabled={isDispatching}
                                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                >
                                  Send to My Gmail
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyTarget(inq);
                                  setReplyDraft(
                                    `Thank you for reaching out regarding "${inq.subject}". I reviewed your note and would be glad to connect.`
                                  );
                                }}
                                className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
                              >
                                Reply via Gmail
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300 font-light whitespace-pre-wrap bg-zinc-950 p-3 border border-zinc-900">
                            {inq.message}
                          </p>
                          {inq.notificationError && (
                            <p className="text-[11px] font-mono text-rose-400">
                              Delivery note: {inq.notificationError}
                            </p>
                          )}

                          {replyTarget?.id === inq.id && (
                            <form
                              onSubmit={promptContactReply}
                              className="pt-2 space-y-2 border-t border-zinc-900"
                            >
                              <textarea
                                rows={3}
                                value={replyDraft}
                                onChange={(e) => setReplyDraft(e.target.value)}
                                placeholder="Write your reply..."
                                className="w-full bg-zinc-950 border border-zinc-700 focus:border-white p-2.5 text-base sm:text-xs text-white outline-none"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReplyTarget(null)}
                                  className="px-3 py-1.5 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isDispatching || !replyDraft.trim()}
                                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                >
                                  Review &amp; Send Reply
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Explicit User Confirmation Sub-Modal for Gmail Send Operations */}
        {confirmAction && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-700 p-6 space-y-4 shadow-2xl">
              <h4 className="text-xs uppercase font-semibold tracking-[0.18em] text-white">
                {confirmAction.title}
              </h4>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                {confirmAction.description}
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={isDispatching}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDispatching}
                  onClick={async () => {
                    const act = confirmAction;
                    setConfirmAction(null);
                    await act.onConfirm();
                  }}
                  className="px-5 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isDispatching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>{confirmAction.confirmLabel}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
