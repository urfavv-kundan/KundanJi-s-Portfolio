import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { validateContactForm } from '../utils/subscription';
import { Send, Check, AlertCircle, Loader2 } from 'lucide-react';
import { TiltCard3D } from './TiltCard3D';

interface ContactSectionProps {
  onContactSubmitted?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onContactSubmitted }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateContactForm(name, email, subject, message);
    if (!validation.isValid) {
      setError(validation.error || 'Please complete all required fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not send your message. Please try again.');
      }

      setSubmittedPayload({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      onContactSubmitted?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Something went wrong sending your message.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 sm:py-28 bg-zinc-950 text-white px-4 sm:px-8 border-t border-zinc-900"
    >
      <div className="max-w-3xl mx-auto">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase mb-3">
            Inquiries &amp; Opportunities
          </p>
          <h2
            className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-white uppercase mb-4"
            style={{ textWrap: 'balance' }}
          >
            Get In Touch
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
            Hiring for an entry-level Data Analyst role or internship, or want to connect and share portfolio feedback? Leave a message below.
          </p>
        </motion.div>

        {/* Sleek Single-Column Form Container wrapped with gentle 3D Tilt */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <TiltCard3D
            maxTilt={2.5}
            hoverY={0}
            glareOpacity={0.05}
            className="group bg-black border border-zinc-800 hover:border-zinc-600 transition-colors duration-300 p-6 sm:p-10"
          >
          <AnimatePresence mode="wait">
            {submittedPayload ? (
              <motion.div
                key="contact-confirmation"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center justify-center text-center py-8 space-y-5"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-black">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold text-white">
                    Message Delivered
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                    Thank you,{' '}
                    <span className="text-white font-medium">
                      {submittedPayload.name}
                    </span>
                    . Your message regarding{' '}
                    <span className="text-white font-medium">
                      &ldquo;{submittedPayload.subject}&rdquo;
                    </span>{' '}
                    has been received by Kundan Patidar.
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSubmittedPayload(null);
                    setName('');
                    setEmail('');
                    setSubject('');
                    setMessage('');
                  }}
                  className="px-6 py-3 bg-white text-black hover:bg-zinc-200 text-xs font-semibold uppercase tracking-[0.16em] transition-colors cursor-pointer min-h-[44px]"
                >
                  Send Another Message
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="contact-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                  <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white">
                    Send a Message
                  </h3>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    All Fields Required
                  </span>
                </div>

                {error && (
                  <div className="p-3.5 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-name"
                      className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
                    >
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Alex Rivera"
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 focus:border-white px-3.5 py-3 text-base sm:text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 min-h-[46px]"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-email"
                      className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
                    >
                      Your Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="alex@company.com"
                      className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 focus:border-white px-3.5 py-3 text-base sm:text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 min-h-[46px]"
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-subject"
                    className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
                  >
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Data Analyst Internship / Entry-Level Role"
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 focus:border-white px-3.5 py-3 text-base sm:text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 min-h-[46px]"
                  />
                </div>

                {/* Message Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-message"
                    className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
                  >
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Share details about an entry-level opportunity, internship, or portfolio feedback..."
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 focus:border-white px-3.5 py-3 text-base sm:text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-200 resize-y min-h-[130px]"
                  />
                </div>

                {/* Submit Row */}
                <div className="pt-2 flex justify-end">
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
                        <span>SENDING...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        <span>SEND MESSAGE</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          </TiltCard3D>
        </motion.div>
      </div>
    </section>
  );
};
