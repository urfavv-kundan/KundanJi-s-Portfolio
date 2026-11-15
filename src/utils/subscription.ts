/**
 * Validation and date formatting utilities for newsletter subscription and contact inquiries
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSubscription(email: string, consent: boolean): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email is required.' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (!consent) {
    return { isValid: false, error: 'Please accept the newsletter subscription terms to proceed.' };
  }

  return { isValid: true };
}

export function validateContactForm(
  name: string,
  email: string,
  subject: string,
  message: string
): ValidationResult {
  if (!name.trim() || name.trim().length < 2) {
    return { isValid: false, error: 'Please enter your name (at least 2 characters).' };
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address so I can reply.' };
  }

  if (!subject.trim() || subject.trim().length < 2) {
    return { isValid: false, error: 'Please enter a subject.' };
  }

  if (!message.trim() || message.trim().length < 5) {
    return { isValid: false, error: 'Please enter a message (at least 5 characters).' };
  }

  return { isValid: true };
}

export function calculateClockDegrees(seconds: number): number {
  return (seconds % 60) * 6; // 360 deg / 60s = 6 deg/sec
}
