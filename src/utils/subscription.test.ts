import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSubscription,
  validateContactForm,
  calculateClockDegrees,
} from './subscription';

test('validateSubscription returns error on empty email', () => {
  const result = validateSubscription('', true);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Email is required.');
});

test('validateSubscription returns error on invalid email format', () => {
  const result = validateSubscription('invalid-email-address', true);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Please enter a valid email address.');
});

test('validateSubscription returns error if newsletter consent is not checked', () => {
  const result = validateSubscription('visitor@example.com', false);
  assert.equal(result.isValid, false);
  assert.equal(result.error, 'Please accept the newsletter subscription terms to proceed.');
});

test('validateSubscription succeeds on valid email and checked consent', () => {
  const result = validateSubscription('visitor@example.com', true);
  assert.equal(result.isValid, true);
  assert.equal(result.error, undefined);
});

test('validateContactForm validates name, email, subject, and message', () => {
  assert.equal(validateContactForm('', 'a@b.com', 'Hello', 'Message body').isValid, false);
  assert.equal(validateContactForm('Alex', 'bad-email', 'Hello', 'Message body').isValid, false);
  assert.equal(validateContactForm('Alex', 'a@b.com', 'H', 'Message body').isValid, false);
  assert.equal(validateContactForm('Alex', 'a@b.com', 'Hello', 'Hi').isValid, false);
  assert.equal(
    validateContactForm('Alex Rivera', 'alex@example.com', 'Power BI Inquiry', 'Let us work together on BI dashboards.').isValid,
    true
  );
});

test('calculateClockDegrees computes accurate degree offsets', () => {
  assert.equal(calculateClockDegrees(0), 0);
  assert.equal(calculateClockDegrees(15), 90);
  assert.equal(calculateClockDegrees(30), 180);
  assert.equal(calculateClockDegrees(45), 270);
  assert.equal(calculateClockDegrees(60), 0);
});
