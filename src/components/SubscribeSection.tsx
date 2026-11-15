import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { validateSubscription } from '../utils/subscription';
import {
  Check,
  Mail,
  Send,
  AlertCircle,
  Loader2,
  Lock,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { OWNER_EMAIL } from '../utils/emailMime';

interface SubscribeSectionProps {
  isOwnerSessionActive?: boolean;
  ownerAccessToken?: string | null;
  autoDispatchEnabled?: boolean;
  pendingSubscribersCount?: number;
  pendingContactsCount?: number;
  onOpenOwnerPortal?: () => void;
  onAutoDispatchSync?: (status: {
    autoDispatchEnabled: boolean;
    pendingSubscribers: number;
    pendingContacts: number;
  }) => void;
  onTokenExpired?: () => void;
  onSubscriberAdded?: () => void;
}

export const SubscribeSection: React.FC<SubscribeSectionProps> = ({
  isOwnerSessionActive = false,
  ownerAccessToken = null,
  autoDispatchEnabled = false,
  pendingSubscribersCount = 0,
  pendingContactsCount = 0,
  onOpenOwnerPortal,
  onAutoDispatchSync,
  onTokenExpired,
  onSubscriberAdded,
}) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Owner-only quick auto-dispatch confirmation state inside #subscribe
  const [showOwnerAutoConfirm, setShowOwnerAutoConfirm] = useState(false);
  const [isTogglingAuto, setIsTogglingAuto] = useState(false);
  const [ownerInlineNotice, setOwnerInlineNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSubscription(email, consent);
    if (!validation.isValid) {
      setError(validation.error || 'Please fill out all required fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          consent,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not register your email. Please try again.');
      }

      if (data.subscriber?.welcomeEmailSent) {
        setStatusMessage(
          `Welcome! ${cleanEmail} is now subscribed and your welcome email has been dispatched.`
        );
      } else {
        setStatusMessage(
          `Registered ${cleanEmail}! Thank you for subscribing to KundanVerse updates.`
        );
      }

      setIsSubmitted(true);
      onSubscriberAdded?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Something went wrong processing your subscription. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAutoDispatch = async (enable: boolean) => {
    if (!ownerAccessToken) {
      onOpenOwnerPortal?.();
      return;
    }
    setIsTogglingAuto(true);
    setOwnerInlineNotice(null);
    try {
      const res = await fetch('/api/owner/auto-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerAccessToken}`,
        },
        body: JSON.stringify({
          enabled: enable,
          dispatchPending: enable,
          portfolioUrl: window.location.origin,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === 'TOKEN_EXPIRED') {
        onTokenExpired?.();
        onAutoDispatchSync?.({
          autoDispatchEnabled: false,
          pendingSubscribers: pendingSubscribersCount,
          pendingContacts: pendingContactsCount,
        });
        setOwnerInlineNotice('Gmail session expired. Please reconnect inside the console.');
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update Gmail Auto-Dispatch.');
      }

      const nextSubs = Array.isArray(data.subscribers) ? data.subscribers : [];
      const nextContacts = Array.isArray(data.contacts) ? data.contacts : [];
      onAutoDispatchSync?.({
        autoDispatchEnabled: Boolean(data.autoDispatchEnabled),
        pendingSubscribers: nextSubs.filter((s: { welcomeEmailSent?: boolean }) => !s.welcomeEmailSent).length,
        pendingContacts: nextContacts.filter((c: { ownerNotified?: boolean }) => !c.ownerNotified).length,
      });

      if (data.autoDispatchEnabled) {
        setOwnerInlineNotice(
          `Auto-Send active! Dispatched ${data.sentWelcomeCount || 0} pending email(s) & forwarded ${data.forwardedContactCount || 0} inquiry(s).`
        );
      } else {
        setOwnerInlineNotice('Auto-Send paused for this session.');
      }
      setShowOwnerAutoConfirm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to toggle Auto-Dispatch.';
      setOwnerInlineNotice(msg);
    } finally {
      setIsTogglingAuto(false);
    }
  };

  return (
    <section
      id="subscribe"
      className="py-20 sm:py-28 bg-black text-white px-4 sm:px-6 lg:px-8 border-t border-zinc-900"
    >
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase mb-3">
          Stay Connected &amp; Follow My Journey
        </p>
        <h2
          className="text-xl sm:text-3xl md:text-4xl font-light tracking-[0.14em] uppercase text-white mb-4 leading-snug"
          style={{ textWrap: 'balance' }}
        >
          Subscribe To KundanVerse
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-md mx-auto mb-10 leading-relaxed">
          Register your email to follow my Data Analytics journey and receive updates as I share upcoming SQL, Python, Pandas, and Excel work.
        </p>

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="sub-confirmed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-8 rounded-none bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors text-center max-w-md mx-auto space-y-4"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-black mb-1">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white">
                Subscription Confirmed!
              </h3>
              {statusMessage && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 text-xs text-emerald-400 font-light flex items-center gap-2 justify-center">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}
              <p className="text-xs text-zinc-400 font-light">
                Thank you for connecting with KundanVerse. Exploring Data, Creating Insights.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                  setConsent(false);
                  setStatusMessage(null);
                }}
                className="text-[11px] uppercase tracking-wider text-zinc-400 hover:text-white underline pt-2 cursor-pointer transition-colors"
              >
                Register another email address
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="sub-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="max-w-md mx-auto text-left space-y-5 sm:space-y-6"
            >
              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Underline Field */}
              <div className="space-y-1">
                <label htmlFor="newsletter-email" className="block text-xs font-light text-zinc-300">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/50 hover:border-white/90 focus:border-white py-2.5 text-base sm:text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 min-h-[46px]"
                  placeholder="your.email@company.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Checkbox row */}
              <div className="flex items-center gap-3 pt-1 group min-h-[44px]">
                <input
                  id="consent-checkbox"
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="h-5 w-5 accent-white rounded-none cursor-pointer shrink-0 transition-transform group-hover:scale-105"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="consent-checkbox"
                  className="text-xs text-zinc-300 group-hover:text-white transition-colors font-light cursor-pointer select-none leading-normal py-1"
                >
                  Yes, subscribe me to receive KundanVerse portfolio updates and upcoming work.{' '}
                  <span className="text-rose-500">*</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row sm:justify-end">
                <motion.button
                  type="submit"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  disabled={isSubmitting}
                  className="group w-full sm:w-auto bg-white text-black hover:bg-zinc-200 text-xs font-semibold tracking-[0.2em] uppercase px-8 py-3.5 transition-colors cursor-pointer min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>REGISTERING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      <span>SUBSCRIBE</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* OWNER-ONLY GMAIL DISPATCH CONSOLE (Strictly hidden from all public/published visitors) */}
        {isOwnerSessionActive && (
          <motion.div
            data-owner-console="subscribe"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 max-w-xl mx-auto p-5 bg-zinc-950 border border-emerald-900/60 hover:border-emerald-700/80 transition-colors text-left space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
                    Gmail Dispatch Console (Owner Only)
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Visible only to {OWNER_EMAIL}
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase px-2.5 py-1 border self-start sm:self-center ${
                  autoDispatchEnabled
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                }`}
              >
                <Zap className="w-3 h-3" />
                {autoDispatchEnabled ? 'Auto-Send Active' : 'Auto-Send Paused'}
              </span>
            </div>

            {ownerInlineNotice && (
              <div className="p-2.5 bg-black border border-zinc-800 text-[11px] font-mono text-emerald-300">
                {ownerInlineNotice}
              </div>
            )}

            <AnimatePresence>
              {showOwnerAutoConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 bg-black border border-emerald-800/70 space-y-3">
                    <p className="text-xs text-zinc-300 font-light leading-relaxed">
                      Confirm enabling automatic Gmail dispatch? New subscribers will immediately receive your welcome email and Get In Touch inquiries will forward automatically to{' '}
                      <span className="font-mono text-white">{OWNER_EMAIL}</span>.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowOwnerAutoConfirm(false)}
                        disabled={isTogglingAuto}
                        className="px-3 py-1.5 text-[11px] font-mono uppercase text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAutoDispatch(true)}
                        disabled={isTogglingAuto}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTogglingAuto ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        <span>Confirm Auto-Send</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900">
              <div className="text-[11px] font-mono text-zinc-400">
                Pending emails: <span className="text-white">{pendingSubscribersCount}</span> · Undelivered messages:{' '}
                <span className="text-white">{pendingContactsCount}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {ownerAccessToken && (
                  autoDispatchEnabled ? (
                    <button
                      type="button"
                      disabled={isTogglingAuto}
                      onClick={() => handleToggleAutoDispatch(false)}
                      className="px-3.5 py-2 min-h-[44px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-mono uppercase tracking-wider text-zinc-200 cursor-pointer"
                    >
                      Pause Auto-Send
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isTogglingAuto}
                      onClick={() => setShowOwnerAutoConfirm(true)}
                      className="px-3.5 py-2 min-h-[44px] bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Enable Auto-Send</span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={onOpenOwnerPortal}
                  className="px-3.5 py-2 min-h-[44px] bg-white text-black hover:bg-zinc-200 text-[11px] font-semibold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Open Console</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};
