/**
 * Gmail Service for sending automated welcome emails and replies
 */
import {
  base64UrlEncode,
  buildWelcomeEmailMime,
  buildContactReplyMime,
  buildContactNotificationEmailMime,
  OWNER_EMAIL,
  OWNER_NAME,
} from '../utils/emailMime';

export {
  base64UrlEncode,
  buildWelcomeEmailMime,
  buildContactReplyMime,
  buildContactNotificationEmailMime,
  OWNER_EMAIL,
  OWNER_NAME,
};

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: string;
}

/**
 * Sends a welcome email directly via the Gmail REST API (used when sending straight from client)
 */
export async function sendWelcomeEmail(
  recipientEmail: string,
  accessToken: string,
  senderName: string = OWNER_NAME,
  portfolioUrl?: string
): Promise<SendEmailResult> {
  try {
    const rawMime = buildWelcomeEmailMime(recipientEmail, senderName, portfolioUrl);
    const encodedMessage = base64UrlEncode(rawMime);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Gmail API error (${response.status})`;
      return {
        success: false,
        error: errorMessage,
        code: response.status === 401 ? 'TOKEN_EXPIRED' : undefined,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send email through Gmail.';
    return {
      success: false,
      error: msg,
    };
  }
}
