import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'accessibility' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (type) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [type, onClose]);

  if (!type) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-none border border-zinc-800 bg-zinc-950 p-5 sm:p-8 text-white shadow-2xl max-h-[88vh] overflow-y-auto">
        {/* Sticky Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
          <h3
            id="legal-modal-title"
            className="text-xs sm:text-sm uppercase font-semibold tracking-[0.2em] text-white"
          >
            {type === 'privacy'
              ? 'Privacy Policy – KundanVerse'
              : 'Accessibility Statement – KundanVerse'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="py-5 text-xs text-zinc-300 space-y-5 font-light leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div className="text-[11px] text-zinc-400 font-mono">
                Last Updated: 5 November 2026
              </div>

              <p>
                At KundanVerse, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect information when you visit our website.
              </p>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  1. Information We Collect
                </h4>
                <p>
                  We may collect basic information such as your name, email address, and any details you voluntarily share through our contact forms.
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  2. How We Use Your Information
                </h4>
                <p className="mb-1.5">We use collected information to:</p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                  <li>Respond to your queries and messages.</li>
                  <li>Improve website content and user experience.</li>
                  <li>Share updates on my Data Analytics skills, learning journey, and upcoming work.</li>
                  <li>Understand website traffic and visitor engagement.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  3. Cookies and Analytics
                </h4>
                <p>
                  Our website may use cookies or analytics tools to understand visitor behavior and improve website performance. These tools may collect non-personal browsing information.
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  4. Information Sharing
                </h4>
                <p>
                  We do not sell, rent, or trade your personal information. Your information may only be shared with trusted service providers when necessary to operate the website or comply with legal obligations.
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  5. Data Security
                </h4>
                <p>
                  We take reasonable measures to protect your personal information against unauthorized access, misuse, or disclosure.
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  6. Third-Party Links
                </h4>
                <p>
                  KundanVerse may contain links to external websites, professional platforms, or project resources. We are not responsible for the privacy practices of those websites.
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  7. Your Rights
                </h4>
                <p>
                  You may request access to, correction of, or deletion of your personal information by contacting us.
                </p>
              </div>

              <div>
                <h4 className="text-white font-medium text-xs mb-1.5 uppercase tracking-wider">
                  8. Policy Updates
                </h4>
                <p>
                  We may update this Privacy Policy from time to time. Any changes will be published on this page.
                </p>
              </div>

              <div className="p-4 rounded-none bg-zinc-900 border border-zinc-800 space-y-1.5">
                <h4 className="text-white font-medium text-xs uppercase tracking-wider">
                  9. Contact Us
                </h4>
                <p className="text-zinc-300">
                  If you have any questions about this Privacy Policy or how your information is handled, feel free to contact us.
                </p>
                <div className="pt-1 space-y-0.5">
                  <p><span className="text-white font-medium">Website:</span> KundanVerse</p>
                  <p>
                    <span className="text-white font-medium">Email: </span>
                    <a href="mailto:patidarkundan971@gmail.com" className="text-zinc-200 underline hover:text-white">
                      patidarkundan971@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <p className="text-zinc-400 italic pt-1">
                Thank you for visiting KundanVerse!
              </p>
            </>
          ) : (
            <>
              <p>
                At KundanVerse, I believe everyone should have equal access to information and digital content. I am committed to making this website accessible, inclusive, and easy to navigate for all visitors, including people with disabilities.
              </p>
              <p>
                I continuously aim to improve the website's accessibility, readability, and user experience so visitors can easily explore my Data Analytics skills, interactive 3D toolkit, and learning journey.
              </p>
              <p>
                If you experience any accessibility issues or have suggestions for improvement, please feel free to contact me.
              </p>
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 text-white font-medium">
                Email:{' '}
                <a href="mailto:patidarkundan971@gmail.com" className="underline hover:text-zinc-300">
                  patidarkundan971@gmail.com
                </a>
              </div>
              <p className="text-zinc-400 italic pt-1">
                Thank you for visiting KundanVerse!
              </p>
            </>
          )}
        </div>

        {/* Sticky Modal Bottom Close Action */}
        <div className="flex justify-end pt-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
