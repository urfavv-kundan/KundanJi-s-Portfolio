/**
 * Shared RFC 2822 / RFC 2045 MIME utilities for Gmail API email dispatch
 * Compatible with both Browser (Vite) and Node.js 22+
 */

export const OWNER_EMAIL = 'patidarkundan971@gmail.com';
export const OWNER_NAME = 'Kundan Patidar';

/**
 * Encodes UTF-8 string to standard Base64
 */
export function utf8ToBase64(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary);
}

/**
 * Wraps Base64 string at 76 characters per line per RFC 2045
 */
export function wrapBase64(b64: string): string {
  return b64.match(/.{1,76}/g)?.join('\r\n') || '';
}

/**
 * Encodes string to URL-safe base64 (RFC 4648) as required by Gmail API `raw` field
 */
export function base64UrlEncode(str: string): string {
  return utf8ToBase64(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Encodes email subject with RFC 2047 UTF-8 Base64 header encoding
 */
export function encodeMimeHeader(value: string): string {
  return `=?UTF-8?B?${utf8ToBase64(value)}?=`;
}

/**
 * Escapes HTML special characters for safe rendering inside HTML email bodies
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds RFC 2822 MIME welcome email for registered portfolio subscribers
 * Uses Content-Transfer-Encoding: base64 to safely support all UTF-8 characters
 */
export function buildWelcomeEmailMime(
  recipientEmail: string,
  senderName: string = OWNER_NAME,
  portfolioUrl: string = 'https://ais-pre-frg4qtorvo7h7bggidhh5s-321428429523.asia-southeast1.run.app'
): string {
  const cleanRecipient = recipientEmail.trim();
  const subject = 'Welcome to KundanVerse – Exploring Data, Creating Insights';
  const encodedSubject = encodeMimeHeader(subject);
  const safeUrl = escapeHtml(portfolioUrl);
  const safeSender = escapeHtml(senderName);

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#000000;border:1px solid #27272a;padding:32px;">
          <tr>
            <td style="border-bottom:1px solid #27272a;padding-bottom:16px;">
              <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#ffffff;font-weight:600;">KUNDANVERSE</div>
              <div style="font-size:11px;color:#a1a1aa;margin-top:4px;">Exploring Data, Creating Insights</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:14px;line-height:1.7;color:#d4d4d8;">
              <p style="margin:0 0 16px 0;color:#ffffff;font-size:16px;">Hello and welcome to KundanVerse!</p>
              <p style="margin:0 0 16px 0;">
                Thank you for registering your email on my Data Analytics portfolio. I am <strong>${safeSender}</strong>, an aspiring Data Analyst (Fresher) focused on turning raw datasets into structured insights and clear analytical solutions.
              </p>
              <div style="background-color:#09090b;border:1px solid #27272a;padding:16px;margin:20px 0;">
                <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;margin-bottom:10px;font-weight:600;">Core Analytical Stack</div>
                <ul style="margin:0;padding-left:18px;color:#d4d4d8;font-size:13px;line-height:1.8;">
                  <li><strong>Microsoft Excel:</strong> Formulas, Pivot Tables &amp; Power Query Cleaning</li>
                  <li><strong>Power BI:</strong> Star Schema Modeling &amp; Foundational DAX Measures</li>
                  <li><strong>MySQL:</strong> Joins, CTEs, Window Functions &amp; Data Auditing</li>
                  <li><strong>Python, Pandas &amp; NumPy:</strong> Exploratory Data Analysis &amp; Data Wrangling</li>
                </ul>
              </div>
              <p style="margin:0 0 20px 0;">
                You will receive updates as I share upcoming SQL, Python, Power BI, and Excel work on KundanVerse. Feel free to reply directly to this email if you would like to connect regarding internships or entry-level Data Analyst opportunities.
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${safeUrl}" style="display:inline-block;background-color:#ffffff;color:#000000;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;padding:12px 24px;">Explore KundanVerse Portfolio</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #27272a;padding-top:16px;font-size:12px;color:#a1a1aa;line-height:1.6;">
              Best regards,<br />
              <strong style="color:#ffffff;">${safeSender}</strong><br />
              Aspiring Data Analyst &middot; KundanVerse<br />
              Email: <a href="mailto:${OWNER_EMAIL}" style="color:#d4d4d8;">${OWNER_EMAIL}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const encodedBody = wrapBase64(utf8ToBase64(htmlBody));

  const mimeLines = [
    `From: "${senderName}" <${OWNER_EMAIL}>`,
    `To: ${cleanRecipient}`,
    `Reply-To: ${OWNER_EMAIL}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    '',
    encodedBody,
  ];

  return mimeLines.join('\r\n');
}

/**
 * Builds RFC 2822 MIME reply email for visitors who submitted the Contact form
 */
export function buildContactReplyMime(
  recipientEmail: string,
  recipientName: string,
  originalSubject: string,
  replyMessage: string,
  senderName: string = OWNER_NAME
): string {
  const cleanRecipient = recipientEmail.trim();
  const subject = `Re: ${originalSubject} – KundanVerse`;
  const encodedSubject = encodeMimeHeader(subject);
  const safeName = escapeHtml(recipientName.trim() || 'there');
  const safeReply = escapeHtml(replyMessage.trim()).replace(/\r?\n/g, '<br />');
  const safeSender = escapeHtml(senderName);

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#000000;border:1px solid #27272a;padding:32px;">
          <tr>
            <td style="border-bottom:1px solid #27272a;padding-bottom:16px;">
              <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#ffffff;font-weight:600;">KUNDANVERSE</div>
              <div style="font-size:11px;color:#a1a1aa;margin-top:4px;">Direct Response from ${safeSender}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:14px;line-height:1.7;color:#d4d4d8;">
              <p style="margin:0 0 16px 0;color:#ffffff;">Hi ${safeName},</p>
              <p style="margin:0 0 16px 0;">${safeReply}</p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #27272a;padding-top:16px;font-size:12px;color:#a1a1aa;line-height:1.6;">
              Best regards,<br />
              <strong style="color:#ffffff;">${safeSender}</strong><br />
              KundanVerse – Exploring Data, Creating Insights.<br />
              <a href="mailto:${OWNER_EMAIL}" style="color:#d4d4d8;">${OWNER_EMAIL}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const encodedBody = wrapBase64(utf8ToBase64(htmlBody));

  const mimeLines = [
    `From: "${senderName}" <${OWNER_EMAIL}>`,
    `To: ${cleanRecipient}`,
    `Reply-To: ${OWNER_EMAIL}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    '',
    encodedBody,
  ];

  return mimeLines.join('\r\n');
}

/**
 * Builds RFC 2822 MIME notification email sent to Kundan (OWNER_EMAIL)
 * whenever a visitor submits the Get In Touch contact form.
 */
export function buildContactNotificationEmailMime(
  visitorName: string,
  visitorEmail: string,
  subject: string,
  message: string,
  receivedAt: string = new Date().toISOString(),
  portfolioUrl: string = 'https://ais-pre-frg4qtorvo7h7bggidhh5s-321428429523.asia-southeast1.run.app'
): string {
  const cleanVisitorName = visitorName.trim() || 'Portfolio Visitor';
  const cleanVisitorEmail = visitorEmail.trim();
  const cleanSubject = subject.trim() || 'Portfolio Inquiry';
  const mailSubject = `[KundanVerse Inquiry] ${cleanSubject} – from ${cleanVisitorName}`;
  const encodedSubject = encodeMimeHeader(mailSubject);

  const safeName = escapeHtml(cleanVisitorName);
  const safeEmail = escapeHtml(cleanVisitorEmail);
  const safeSubject = escapeHtml(cleanSubject);
  const safeMessage = escapeHtml(message.trim()).replace(/\r?\n/g, '<br />');
  const safeUrl = escapeHtml(portfolioUrl);
  const formattedTime = escapeHtml(new Date(receivedAt).toUTCString());

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#09090b;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#000000;border:1px solid #27272a;padding:32px;">
          <tr>
            <td style="border-bottom:1px solid #27272a;padding-bottom:16px;">
              <div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#ffffff;font-weight:600;">KUNDANVERSE · NEW CONTACT MESSAGE</div>
              <div style="font-size:11px;color:#a1a1aa;margin-top:4px;">Submitted via Portfolio Get In Touch Form</div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;font-size:13px;line-height:1.7;color:#d4d4d8;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;border:1px solid #27272a;padding:16px;margin-bottom:20px;font-size:12px;">
                <tr>
                  <td style="padding:4px 0;color:#a1a1aa;width:90px;">From:</td>
                  <td style="padding:4px 0;color:#ffffff;font-weight:600;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#a1a1aa;">Email:</td>
                  <td style="padding:4px 0;"><a href="mailto:${safeEmail}" style="color:#34d399;text-decoration:none;">${safeEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#a1a1aa;">Subject:</td>
                  <td style="padding:4px 0;color:#ffffff;">${safeSubject}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#a1a1aa;">Received:</td>
                  <td style="padding:4px 0;color:#d4d4d8;">${formattedTime}</td>
                </tr>
              </table>

              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a1a1aa;margin-bottom:8px;font-weight:600;">Message</div>
              <div style="background-color:#09090b;border:1px solid #27272a;padding:16px;color:#f4f4f5;font-size:14px;line-height:1.7;">
                ${safeMessage}
              </div>

              <p style="margin:20px 0 0 0;font-size:12px;color:#a1a1aa;">
                Hit <strong>Reply</strong> directly in Gmail to respond to <a href="mailto:${safeEmail}" style="color:#ffffff;">${safeEmail}</a>, or manage replies from your <a href="${safeUrl}" style="color:#ffffff;">KundanVerse</a> Owner Console.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const encodedBody = wrapBase64(utf8ToBase64(htmlBody));
  const safeHeaderName = cleanVisitorName.replace(/["\r\n]/g, '');
  const safeHeaderEmail = cleanVisitorEmail.replace(/[\r\n]/g, '');

  const mimeLines = [
    `From: "${OWNER_NAME} (KundanVerse)" <${OWNER_EMAIL}>`,
    `To: ${OWNER_EMAIL}`,
    `Reply-To: "${safeHeaderName}" <${safeHeaderEmail}>`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    '',
    encodedBody,
  ];

  return mimeLines.join('\r\n');
}
