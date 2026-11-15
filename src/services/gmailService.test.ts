import { test } from 'node:test';
import assert from 'node:assert';
import {
  base64UrlEncode,
  buildWelcomeEmailMime,
  buildContactReplyMime,
  buildContactNotificationEmailMime,
} from './gmailService';

test('base64UrlEncode creates URL-safe base64 without +, / or trailing =', () => {
  const sample = 'Hello world! ? > < / + =';
  const encoded = base64UrlEncode(sample);
  assert.ok(!encoded.includes('+'), 'Should not contain +');
  assert.ok(!encoded.includes('/'), 'Should not contain /');
  assert.ok(!encoded.endsWith('='), 'Should not contain trailing =');
});

test('buildWelcomeEmailMime builds valid RFC 2822 UTF-8 base64 email with KundanVerse branding', () => {
  const email = 'subscriber@example.com';
  const mime = buildWelcomeEmailMime(email, 'Kundan Patidar', 'https://kundanverse.example.com');
  assert.ok(mime.includes(`To: ${email}`), 'MIME must include recipient');
  assert.ok(mime.includes('Reply-To: patidarkundan971@gmail.com'), 'MIME must include Reply-To');
  assert.ok(mime.includes('Content-Type: text/html; charset="UTF-8"'), 'MIME must use UTF-8 HTML');
  assert.ok(mime.includes('Content-Transfer-Encoding: base64'), 'MIME must use base64 encoding');

  const [, encodedBody] = mime.split('\r\n\r\n');
  const decodedHtml = Buffer.from(encodedBody.replace(/\r\n/g, ''), 'base64').toString('utf-8');
  assert.ok(decodedHtml.includes('KundanVerse'), 'Decoded body must include KundanVerse');
  assert.ok(decodedHtml.includes('patidarkundan971@gmail.com'), 'Decoded body must include contact email');
  assert.ok(decodedHtml.includes('https://kundanverse.example.com'), 'Decoded body must include portfolio URL');
});

test('buildContactReplyMime escapes HTML and builds valid MIME reply', () => {
  const mime = buildContactReplyMime(
    'visitor@example.com',
    'Alex <script>',
    'Dashboard Project',
    'Hello & thanks for reaching out!'
  );
  assert.ok(mime.includes('To: visitor@example.com'));
  const [, encodedBody] = mime.split('\r\n\r\n');
  const decodedHtml = Buffer.from(encodedBody.replace(/\r\n/g, ''), 'base64').toString('utf-8');
  assert.ok(!decodedHtml.includes('<script>'), 'Must escape script tags');
  assert.ok(decodedHtml.includes('Alex &lt;script&gt;'), 'Must escape visitor name safely');
  assert.ok(decodedHtml.includes('Hello &amp; thanks for reaching out!'), 'Must escape reply text');
});

test('buildContactNotificationEmailMime forwards inquiry to owner email with visitor Reply-To and HTML escaping', () => {
  const mime = buildContactNotificationEmailMime(
    'Priya <img src=x>',
    'priya@recruiter.com',
    'Junior Analyst Role',
    'Hi Kundan,\nLet us schedule an interview <soon>.'
  );
  assert.ok(mime.includes('To: patidarkundan971@gmail.com'), 'Notification must go to owner');
  assert.ok(mime.includes('Reply-To: "Priya <img src=x>" <priya@recruiter.com>'), 'Reply-To must target visitor');
  const [, encodedBody] = mime.split('\r\n\r\n');
  const decodedHtml = Buffer.from(encodedBody.replace(/\r\n/g, ''), 'base64').toString('utf-8');
  assert.ok(!decodedHtml.includes('<img src=x>'), 'Must escape HTML in visitor name');
  assert.ok(decodedHtml.includes('Priya &lt;img src=x&gt;'), 'Escaped name should appear');
  assert.ok(decodedHtml.includes('Junior Analyst Role'), 'Subject must appear in email');
  assert.ok(decodedHtml.includes('Let us schedule an interview &lt;soon&gt;.'), 'Escaped message must appear');
});
