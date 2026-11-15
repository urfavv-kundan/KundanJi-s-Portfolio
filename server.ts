import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import {
  OWNER_EMAIL,
  OWNER_NAME,
  base64UrlEncode,
  buildWelcomeEmailMime,
  buildContactReplyMime,
  buildContactNotificationEmailMime,
} from './src/utils/emailMime.ts';

dotenv.config();

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

interface PortfolioStore {
  subscribers: SubscriberRecord[];
  contacts: ContactInquiry[];
}

// Strictly in-memory OAuth auto-dispatch state (never persisted to disk or client storage)
interface AutoDispatchState {
  enabled: boolean;
  token: string | null;
  armedAt: string | null;
  lastAutoError?: string;
}

const autoDispatchState: AutoDispatchState = {
  enabled: false,
  token: null,
  armedAt: null,
};

function resolvePortfolioUrl(req?: Request): string {
  const originHeader = req?.headers?.origin;
  if (typeof originHeader === 'string' && originHeader.startsWith('http')) {
    return originHeader;
  }
  return (
    process.env.APP_URL ||
    'https://ais-pre-frg4qtorvo7h7bggidhh5s-321428429523.asia-southeast1.run.app'
  );
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'portfolio-store.json');

let storeLock: Promise<void> = Promise.resolve();

async function withStoreLock<T>(fn: () => Promise<T>): Promise<T> {
  let release: () => void = () => {};
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const prev = storeLock;
  storeLock = next;
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

async function readStore(): Promise<PortfolioStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
    };
  } catch {
    return { subscribers: [], contacts: [] };
  }
}

async function writeStore(store: PortfolioStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

interface OwnerAuthContext {
  token: string;
  email: string;
  scopes: string[];
}

async function verifyOwnerToken(authHeader: string | undefined): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  code?: string;
  context?: OwnerAuthContext;
}> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      code: 'MISSING_TOKEN',
      error: 'Owner authentication token is required.',
    };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'MISSING_TOKEN',
      error: 'Owner authentication token is empty.',
    };
  }

  try {
    const tokenInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(token)}`
    );

    if (!tokenInfoRes.ok) {
      return {
        ok: false,
        status: 401,
        code: 'TOKEN_EXPIRED',
        error: 'Gmail access token has expired or is invalid. Please reconnect your Google account.',
      };
    }

    const tokenInfo = (await tokenInfoRes.json()) as {
      email?: string;
      scope?: string;
      error_description?: string;
    };

    let email = (tokenInfo.email || '').toLowerCase().trim();
    const scopes = (tokenInfo.scope || '').split(/\s+/).filter(Boolean);

    // Fallback to userinfo if tokeninfo didn't include email
    if (!email) {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userInfoRes.ok) {
        const userInfo = (await userInfoRes.json()) as { email?: string };
        email = (userInfo.email || '').toLowerCase().trim();
      }
    }

    if (email !== OWNER_EMAIL.toLowerCase()) {
      return {
        ok: false,
        status: 403,
        code: 'FORBIDDEN',
        error: `Access denied. Only site owner (${OWNER_EMAIL}) is authorized.`,
      };
    }

    return {
      ok: true,
      status: 200,
      context: { token, email, scopes },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Token verification failed';
    return {
      ok: false,
      status: 500,
      code: 'VERIFY_ERROR',
      error: msg,
    };
  }
}

async function sendRawGmail(accessToken: string, rawMime: string): Promise<{
  success: boolean;
  messageId?: string;
  status?: number;
  error?: string;
}> {
  const encodedMessage = base64UrlEncode(rawMime);
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) as {
      error?: { message?: string; status?: string };
    };
    return {
      success: false,
      status: response.status,
      error: errData?.error?.message || `Gmail API returned HTTP ${response.status}`,
    };
  }

  const data = (await response.json()) as { id?: string };
  return {
    success: true,
    status: 200,
    messageId: data.id,
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Public: Register subscriber email (auto-sends welcome email if Owner Auto-Dispatch is armed)
  app.post('/api/subscribers', async (req: Request, res: Response) => {
    const { email, consent } = (req.body || {}) as { email?: string; consent?: boolean };
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!consent) {
      res.status(400).json({ error: 'Please accept the newsletter subscription terms to proceed.' });
      return;
    }

    const result = await withStoreLock(async () => {
      const store = await readStore();
      const existing = store.subscribers.find((s) => s.email === normalizedEmail);
      if (existing) {
        return { subscriber: existing, isNew: false };
      }
      const created: SubscriberRecord = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        subscribedAt: new Date().toISOString(),
        welcomeEmailSent: false,
      };
      store.subscribers.unshift(created);
      await writeStore(store);
      return { subscriber: created, isNew: true };
    });

    let subscriberState = result.subscriber;

    // Automatically dispatch welcome email when owner session has armed Auto-Dispatch in memory
    if (!subscriberState.welcomeEmailSent && autoDispatchState.enabled && autoDispatchState.token) {
      const rawMime = buildWelcomeEmailMime(
        subscriberState.email,
        OWNER_NAME,
        resolvePortfolioUrl(req)
      );
      const sendRes = await sendRawGmail(autoDispatchState.token, rawMime);

      if (!sendRes.success && sendRes.status === 401) {
        autoDispatchState.enabled = false;
        autoDispatchState.token = null;
        autoDispatchState.lastAutoError = 'Gmail session expired. Please reconnect in Owner Console.';
      }

      subscriberState = await withStoreLock(async () => {
        const store = await readStore();
        const rec = store.subscribers.find((s) => s.id === subscriberState.id);
        if (rec) {
          if (sendRes.success) {
            rec.welcomeEmailSent = true;
            rec.welcomeEmailSentAt = new Date().toISOString();
            rec.gmailMessageId = sendRes.messageId;
            delete rec.lastError;
          } else {
            rec.lastError = sendRes.error || 'Automatic Gmail dispatch failed';
          }
          await writeStore(store);
          return rec;
        }
        return subscriberState;
      });
    }

    res.status(result.isNew ? 201 : 200).json({
      success: true,
      isNew: result.isNew,
      subscriber: {
        id: subscriberState.id,
        email: subscriberState.email,
        subscribedAt: subscriberState.subscribedAt,
        welcomeEmailSent: subscriberState.welcomeEmailSent,
      },
    });
  });

  // Public: Submit contact inquiry (Name, Email, Subject, Message) and auto-forward to patidarkundan971@gmail.com when armed
  app.post('/api/contact', async (req: Request, res: Response) => {
    const { name, email, subject, message } = (req.body || {}) as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSubject = (subject || '').trim();
    const cleanMessage = (message || '').trim();

    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!cleanSubject || cleanSubject.length < 2) {
      res.status(400).json({ error: 'Please enter a subject.' });
      return;
    }
    if (!cleanMessage || cleanMessage.length < 5) {
      res.status(400).json({ error: 'Please enter a message (at least 5 characters).' });
      return;
    }

    const inquiry: ContactInquiry = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      ownerNotified: false,
      replySent: false,
    };

    await withStoreLock(async () => {
      const store = await readStore();
      store.contacts.unshift(inquiry);
      await writeStore(store);
    });

    if (autoDispatchState.enabled && autoDispatchState.token) {
      const rawMime = buildContactNotificationEmailMime(
        inquiry.name,
        inquiry.email,
        inquiry.subject,
        inquiry.message,
        inquiry.createdAt,
        resolvePortfolioUrl(req)
      );
      const sendRes = await sendRawGmail(autoDispatchState.token, rawMime);

      if (!sendRes.success && sendRes.status === 401) {
        autoDispatchState.enabled = false;
        autoDispatchState.token = null;
        autoDispatchState.lastAutoError = 'Gmail session expired. Please reconnect in Owner Console.';
      }

      await withStoreLock(async () => {
        const store = await readStore();
        const rec = store.contacts.find((c) => c.id === inquiry.id);
        if (rec) {
          if (sendRes.success) {
            rec.ownerNotified = true;
            rec.ownerNotifiedAt = new Date().toISOString();
            rec.notificationMessageId = sendRes.messageId;
            delete rec.notificationError;
          } else {
            rec.notificationError = sendRes.error || 'Automatic forwarding failed';
          }
          await writeStore(store);
        }
      });
    }

    res.status(201).json({
      success: true,
      inquiryId: inquiry.id,
      message: 'Your message has been received and delivered to Kundan.',
    });
  });

  // Owner-only middleware
  const requireOwner = async (req: Request, res: Response, next: NextFunction) => {
    const verification = await verifyOwnerToken(req.headers.authorization);
    if (!verification.ok || !verification.context) {
      res.status(verification.status).json({
        error: verification.error,
        code: verification.code,
      });
      return;
    }
    (req as Request & { ownerAuth?: OwnerAuthContext }).ownerAuth = verification.context;
    next();
  };

  // Owner-only: Get all registered subscribers, contact inquiries, and auto-dispatch status
  app.get('/api/owner/overview', requireOwner, async (req: Request, res: Response) => {
    const ownerAuth = (req as Request & { ownerAuth?: OwnerAuthContext }).ownerAuth!;
    if (autoDispatchState.enabled) {
      autoDispatchState.token = ownerAuth.token;
    }
    const store = await readStore();
    res.json({
      ownerEmail: OWNER_EMAIL,
      autoDispatchEnabled: Boolean(autoDispatchState.enabled && autoDispatchState.token),
      autoDispatchArmedAt: autoDispatchState.armedAt,
      lastAutoError: autoDispatchState.lastAutoError || null,
      subscribers: store.subscribers,
      contacts: store.contacts,
    });
  });

  // Owner-only: Enable or disable server-side in-memory Gmail Auto-Dispatch (with optional catch-up send)
  app.post('/api/owner/auto-dispatch', requireOwner, async (req: Request, res: Response) => {
    const ownerAuth = (req as Request & { ownerAuth?: OwnerAuthContext }).ownerAuth!;
    const { enabled, dispatchPending, portfolioUrl } = (req.body || {}) as {
      enabled?: boolean;
      dispatchPending?: boolean;
      portfolioUrl?: string;
    };

    const nextEnabled = Boolean(enabled);
    if (!nextEnabled) {
      autoDispatchState.enabled = false;
      autoDispatchState.token = null;
      autoDispatchState.armedAt = null;
      delete autoDispatchState.lastAutoError;

      const store = await readStore();
      res.json({
        success: true,
        autoDispatchEnabled: false,
        autoDispatchArmedAt: null,
        sentWelcomeCount: 0,
        forwardedContactCount: 0,
        subscribers: store.subscribers,
        contacts: store.contacts,
      });
      return;
    }

    autoDispatchState.enabled = true;
    autoDispatchState.token = ownerAuth.token;
    autoDispatchState.armedAt = new Date().toISOString();
    delete autoDispatchState.lastAutoError;

    let sentWelcomeCount = 0;
    let forwardedContactCount = 0;

    if (dispatchPending) {
      const resolvedUrl = portfolioUrl || resolvePortfolioUrl(req);
      const snapshot = await readStore();
      const pendingSubs = snapshot.subscribers.filter((s) => !s.welcomeEmailSent);
      const pendingContacts = snapshot.contacts.filter((c) => !c.ownerNotified);

      const subResults: Array<{ id: string; success: boolean; messageId?: string; error?: string }> = [];
      for (const sub of pendingSubs) {
        const rawMime = buildWelcomeEmailMime(sub.email, OWNER_NAME, resolvedUrl);
        const sendRes = await sendRawGmail(ownerAuth.token, rawMime);
        if (!sendRes.success && sendRes.status === 401) {
          autoDispatchState.enabled = false;
          autoDispatchState.token = null;
          res.status(401).json({
            code: 'TOKEN_EXPIRED',
            error: 'Gmail session expired while enabling Auto-Dispatch. Please reconnect Google.',
          });
          return;
        }
        subResults.push({
          id: sub.id,
          success: sendRes.success,
          messageId: sendRes.messageId,
          error: sendRes.error,
        });
      }

      const contactResults: Array<{ id: string; success: boolean; messageId?: string; error?: string }> = [];
      for (const inq of pendingContacts) {
        const rawMime = buildContactNotificationEmailMime(
          inq.name,
          inq.email,
          inq.subject,
          inq.message,
          inq.createdAt,
          resolvedUrl
        );
        const sendRes = await sendRawGmail(ownerAuth.token, rawMime);
        if (!sendRes.success && sendRes.status === 401) {
          autoDispatchState.enabled = false;
          autoDispatchState.token = null;
          res.status(401).json({
            code: 'TOKEN_EXPIRED',
            error: 'Gmail session expired while forwarding inquiries. Please reconnect Google.',
          });
          return;
        }
        contactResults.push({
          id: inq.id,
          success: sendRes.success,
          messageId: sendRes.messageId,
          error: sendRes.error,
        });
      }

      if (subResults.length > 0 || contactResults.length > 0) {
        await withStoreLock(async () => {
          const store = await readStore();
          for (const r of subResults) {
            const target = store.subscribers.find((s) => s.id === r.id);
            if (!target) continue;
            if (r.success) {
              target.welcomeEmailSent = true;
              target.welcomeEmailSentAt = new Date().toISOString();
              target.gmailMessageId = r.messageId;
              delete target.lastError;
              sentWelcomeCount += 1;
            } else {
              target.lastError = r.error || 'Gmail API delivery failed';
            }
          }
          for (const r of contactResults) {
            const target = store.contacts.find((c) => c.id === r.id);
            if (!target) continue;
            if (r.success) {
              target.ownerNotified = true;
              target.ownerNotifiedAt = new Date().toISOString();
              target.notificationMessageId = r.messageId;
              delete target.notificationError;
              forwardedContactCount += 1;
            } else {
              target.notificationError = r.error || 'Gmail API delivery failed';
            }
          }
          await writeStore(store);
        });
      }
    }

    const latestStore = await readStore();
    res.json({
      success: true,
      autoDispatchEnabled: Boolean(autoDispatchState.enabled && autoDispatchState.token),
      autoDispatchArmedAt: autoDispatchState.armedAt,
      sentWelcomeCount,
      forwardedContactCount,
      subscribers: latestStore.subscribers,
      contacts: latestStore.contacts,
    });
  });

  // Owner-only: Forward Get In Touch contact inquiries to patidarkundan971@gmail.com
  app.post('/api/owner/forward-contacts', requireOwner, async (req: Request, res: Response) => {
    const ownerAuth = (req as Request & { ownerAuth?: OwnerAuthContext }).ownerAuth!;
    const { inquiryIds, portfolioUrl } = (req.body || {}) as {
      inquiryIds?: string[];
      portfolioUrl?: string;
    };

    const resolvedUrl = portfolioUrl || resolvePortfolioUrl(req);
    const snapshot = await readStore();
    const targets =
      Array.isArray(inquiryIds) && inquiryIds.length > 0
        ? snapshot.contacts.filter((c) => inquiryIds.includes(c.id))
        : snapshot.contacts.filter((c) => !c.ownerNotified);

    if (targets.length === 0) {
      res.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        contacts: snapshot.contacts,
      });
      return;
    }

    const results: Array<{ id: string; success: boolean; messageId?: string; error?: string }> = [];
    for (const inq of targets) {
      const rawMime = buildContactNotificationEmailMime(
        inq.name,
        inq.email,
        inq.subject,
        inq.message,
        inq.createdAt,
        resolvedUrl
      );
      const sendRes = await sendRawGmail(ownerAuth.token, rawMime);

      if (!sendRes.success && sendRes.status === 401) {
        res.status(401).json({
          code: 'TOKEN_EXPIRED',
          error: 'Gmail session expired during forwarding. Please reconnect your Google account.',
        });
        return;
      }

      results.push({
        id: inq.id,
        success: sendRes.success,
        messageId: sendRes.messageId,
        error: sendRes.error,
      });
    }

    const updatedStore = await withStoreLock(async () => {
      const store = await readStore();
      for (const r of results) {
        const rec = store.contacts.find((c) => c.id === r.id);
        if (!rec) continue;
        if (r.success) {
          rec.ownerNotified = true;
          rec.ownerNotifiedAt = new Date().toISOString();
          rec.notificationMessageId = r.messageId;
          delete rec.notificationError;
        } else {
          rec.notificationError = r.error || 'Gmail forwarding failed';
        }
      }
      await writeStore(store);
      return store;
    });

    res.json({
      success: true,
      sentCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      contacts: updatedStore.contacts,
    });
  });

  // Owner-only: Send or dispatch welcome emails via Gmail API
  app.post('/api/owner/dispatch-welcome', requireOwner, async (req: Request, res: Response) => {
    const ownerAuth = (req as Request & { ownerAuth?: OwnerAuthContext }).ownerAuth!;
    const { subscriberIds, recipientEmail, portfolioUrl } = (req.body || {}) as {
      subscriberIds?: string[];
      recipientEmail?: string;
      portfolioUrl?: string;
    };

    const resolvedPortfolioUrl =
      portfolioUrl ||
      process.env.APP_URL ||
      'https://ais-pre-frg4qtorvo7h7bggidhh5s-321428429523.asia-southeast1.run.app';

    // Single direct / test email mode
    if (recipientEmail) {
      const cleanRecipient = recipientEmail.trim().toLowerCase();
      if (!EMAIL_REGEX.test(cleanRecipient)) {
        res.status(400).json({ error: 'Invalid recipient email address.' });
        return;
      }

      const rawMime = buildWelcomeEmailMime(cleanRecipient, OWNER_NAME, resolvedPortfolioUrl);
      const sendRes = await sendRawGmail(ownerAuth.token, rawMime);

      if (!sendRes.success) {
        if (sendRes.status === 401) {
          res.status(401).json({
            code: 'TOKEN_EXPIRED',
            error: 'Gmail session expired. Please reconnect your Google account.',
          });
          return;
        }
        res.status(502).json({ error: sendRes.error || 'Failed to send email via Gmail API.' });
        return;
      }

      // Mark subscriber as sent if present in store
      const updatedStore = await withStoreLock(async () => {
        const store = await readStore();
        const found = store.subscribers.find((s) => s.email === cleanRecipient);
        if (found) {
          found.welcomeEmailSent = true;
          found.welcomeEmailSentAt = new Date().toISOString();
          found.gmailMessageId = sendRes.messageId;
          delete found.lastError;
          await writeStore(store);
        }
        return store;
      });

      res.json({
        success: true,
        sentCount: 1,
        failedCount: 0,
        messageId: sendRes.messageId,
        subscribers: updatedStore.subscribers,
      });
      return;
    }

    // Batch / targeted subscriber queue dispatch
    const storeSnapshot = await readStore();
    const targets =
      Array.isArray(subscriberIds) && subscriberIds.length > 0
        ? storeSnapshot.subscribers.filter((s) => subscriberIds.includes(s.id))
        : storeSnapshot.subscribers.filter((s) => !s.welcomeEmailSent);

    if (targets.length === 0) {
      res.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        results: [],
        subscribers: storeSnapshot.subscribers,
      });
      return;
    }

    const results: Array<{ id: string; email: string; success: boolean; messageId?: string; error?: string }> = [];

    for (const target of targets) {
      const rawMime = buildWelcomeEmailMime(target.email, OWNER_NAME, resolvedPortfolioUrl);
      const sendRes = await sendRawGmail(ownerAuth.token, rawMime);

      if (!sendRes.success && sendRes.status === 401) {
        res.status(401).json({
          code: 'TOKEN_EXPIRED',
          error: 'Gmail session expired during dispatch. Please reconnect your Google account.',
        });
        return;
      }

      results.push({
        id: target.id,
        email: target.email,
        success: sendRes.success,
        messageId: sendRes.messageId,
        error: sendRes.error,
      });
    }

    const finalStore = await withStoreLock(async () => {
      const store = await readStore();
      for (const r of results) {
        const rec = store.subscribers.find((s) => s.id === r.id);
        if (!rec) continue;
        if (r.success) {
          rec.welcomeEmailSent = true;
          rec.welcomeEmailSentAt = new Date().toISOString();
          rec.gmailMessageId = r.messageId;
          delete rec.lastError;
        } else {
          rec.lastError = r.error || 'Gmail API delivery failed';
        }
      }
      await writeStore(store);
      return store;
    });

    res.json({
      success: true,
      sentCount: results.filter((r) => r.success).length,
      failedCount: results.filter((r) => !r.success).length,
      results,
      subscribers: finalStore.subscribers,
    });
  });

  // Owner-only: Reply to a contact inquiry directly via Gmail API
  app.post('/api/owner/reply-contact', requireOwner, async (req: Request, res: Response) => {
    const ownerAuth = (req as Request & { ownerAuth?: OwnerAuthContext }).ownerAuth!;
    const { inquiryId, replyMessage } = (req.body || {}) as {
      inquiryId?: string;
      replyMessage?: string;
    };

    if (!inquiryId || !replyMessage?.trim()) {
      res.status(400).json({ error: 'Inquiry ID and reply message are required.' });
      return;
    }

    const store = await readStore();
    const inquiry = store.contacts.find((c) => c.id === inquiryId);
    if (!inquiry) {
      res.status(404).json({ error: 'Contact inquiry not found.' });
      return;
    }

    const rawMime = buildContactReplyMime(
      inquiry.email,
      inquiry.name,
      inquiry.subject,
      replyMessage.trim(),
      OWNER_NAME
    );

    const sendRes = await sendRawGmail(ownerAuth.token, rawMime);
    if (!sendRes.success) {
      if (sendRes.status === 401) {
        res.status(401).json({
          code: 'TOKEN_EXPIRED',
          error: 'Gmail session expired. Please reconnect your Google account.',
        });
        return;
      }
      res.status(502).json({ error: sendRes.error || 'Failed to send reply via Gmail API.' });
      return;
    }

    const updatedStore = await withStoreLock(async () => {
      const current = await readStore();
      const target = current.contacts.find((c) => c.id === inquiryId);
      if (target) {
        target.replySent = true;
        target.replySentAt = new Date().toISOString();
        target.gmailMessageId = sendRes.messageId;
        await writeStore(current);
      }
      return current;
    });

    res.json({
      success: true,
      messageId: sendRes.messageId,
      contacts: updatedStore.contacts,
    });
  });

  // Mount Vite dev middleware or serve built dist static files
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KundanVerse server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
