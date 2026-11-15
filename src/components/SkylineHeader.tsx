import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { Instagram, Facebook, Menu, X } from 'lucide-react';

interface SkylineHeaderProps {
  onSubscribeClick: () => void;
}

export const SkylineHeader: React.FC<SkylineHeaderProps> = ({ onSubscribeClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: '3D Lab', href: '#data-lab' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full px-4 sm:px-8 md:px-10 py-3.5 sm:py-4 flex items-center justify-between gap-4 sm:gap-8 text-white bg-black/85 backdrop-blur-md border-b border-zinc-900">
      {/* Zone 1: Brand Wordmark */}
      <a
        href="#"
        className="text-xs sm:text-sm md:text-base font-semibold tracking-[0.22em] sm:tracking-[0.35em] uppercase hover:opacity-80 transition-opacity whitespace-nowrap shrink-0 py-2 inline-flex items-center"
      >
        KundanVerse
      </a>

      {/* Zone 2: Desktop Navigation Links */}
      <nav className="hidden lg:flex items-center gap-7 text-xs uppercase tracking-[0.16em] font-light text-zinc-300">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="relative hover:text-white transition-colors py-1 whitespace-nowrap shrink-0 group"
          >
            <span>{link.label}</span>
            <span className="absolute left-0 right-0 bottom-0 h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </a>
        ))}
      </nav>

      {/* Zone 3: Primary Action & Social Links */}
      <div className="flex items-center gap-2 sm:gap-5 shrink-0">
        <motion.button
          type="button"
          whileHover={{ y: -1, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={() => {
            setMobileMenuOpen(false);
            onSubscribeClick();
          }}
          className="text-[11px] sm:text-xs font-medium tracking-[0.14em] uppercase bg-white text-black px-3.5 sm:px-4 py-2 hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[44px] sm:min-h-[38px] inline-flex items-center justify-center"
        >
          Subscribe
        </motion.button>

        {/* Social Icons Bar */}
        <div className="hidden sm:flex items-center gap-2.5 text-white">
          <a
            href="https://x.com/Kundan748908"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="X (formerly Twitter) - Kundan748908"
            className="p-1.5 text-zinc-300 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a
            href="https://www.instagram.com/theyluv.kundan?dlrf=emhyenJyb2p1OG00"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Instagram - theyluv.kundan"
            className="p-1.5 text-zinc-300 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
          >
            <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>

          <a
            href="https://www.facebook.com/share/1H2zHKFQ7L/"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Facebook"
            className="p-1.5 text-zinc-300 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
          >
            <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>

          <a
            href="https://www.fiverr.com/s/8xyj60o"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Fiverr Profile - Kundan Patidar"
            title="Fiverr"
            className="p-1.5 text-zinc-300 hover:text-emerald-400 hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12.5 2H9.8C7.15 2 5.5 3.65 5.5 6.3V8H3v3h2.5v9H9v-9h5.5v9H18V8H9V6.3c0-.9.5-1.4 1.4-1.4h2.1V2z" />
              <circle cx="16.25" cy="4.25" r="2.1" />
            </svg>
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden p-2 text-zinc-300 hover:text-white cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Smooth Scroll Progress Indicator */}
      <motion.div
        style={{ scaleX }}
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-white origin-left pointer-events-none"
      />

      {/* Animated Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 top-full bg-black/60 z-30"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden absolute top-full left-0 right-0 z-40 bg-zinc-950 border-b border-zinc-800 px-5 py-4 space-y-3 shadow-2xl max-h-[82vh] overflow-y-auto"
            >
              <nav className="flex flex-col space-y-1 text-xs uppercase tracking-[0.18em] font-medium text-zinc-300">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-white py-3 min-h-[44px] border-b border-zinc-900 flex items-center justify-between"
                  >
                    <span>{link.label}</span>
                    <span className="text-zinc-600 text-[10px] font-mono">-&gt;</span>
                  </a>
                ))}
                <a
                  href="#subscribe"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:underline py-3 min-h-[44px] flex items-center"
                >
                  Subscribe to Updates
                </a>
              </nav>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-900 text-white">
                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                  Follow Kundan:
                </span>
                <div className="flex items-center gap-1">
                  <a
                    href="https://x.com/Kundan748908"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="X (formerly Twitter)"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-300 hover:text-white"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/theyluv.kundan?dlrf=emhyenJyb2p1OG00"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Instagram"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-300 hover:text-white"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.facebook.com/share/1H2zHKFQ7L/"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Facebook"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-300 hover:text-white"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.fiverr.com/s/8xyj60o"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Fiverr Profile - Kundan Patidar"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-300 hover:text-emerald-400"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12.5 2H9.8C7.15 2 5.5 3.65 5.5 6.3V8H3v3h2.5v9H9v-9h5.5v9H18V8H9V6.3c0-.9.5-1.4 1.4-1.4h2.1V2z" />
                      <circle cx="16.25" cy="4.25" r="2.1" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
