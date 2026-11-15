import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface SkylineFooterProps {
  onOpenPrivacy: () => void;
  onOpenAccessibility: () => void;
  onOpenOwnerPortal: () => void;
  isOwnerSessionActive?: boolean;
}

export const SkylineFooter: React.FC<SkylineFooterProps> = ({
  onOpenPrivacy,
  onOpenAccessibility,
  onOpenOwnerPortal,
  isOwnerSessionActive = false,
}) => {
  return (
    <footer className="w-full bg-black py-8 px-4 sm:px-8 md:px-10 border-t border-zinc-900 text-[11px] sm:text-xs text-zinc-400 font-light">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        {/* Left Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="group relative hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
          >
            <span>Privacy Policy</span>
            <span className="absolute left-0 right-0 bottom-2 h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </button>
          <button
            type="button"
            onClick={onOpenAccessibility}
            className="group relative hover:text-white transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
          >
            <span>Accessibility Statement</span>
            <span className="absolute left-0 right-0 bottom-2 h-px bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </button>
          <a
            href="https://www.fiverr.com/s/8xyj60o"
            target="_blank"
            rel="noreferrer noopener"
            className="group relative hover:text-emerald-400 transition-colors cursor-pointer min-h-[44px] min-w-[44px] px-1 inline-flex items-center justify-center"
          >
            <span>Fiverr</span>
            <span className="absolute left-0 right-0 bottom-2 h-px bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </a>
          {isOwnerSessionActive && (
            <button
              type="button"
              onClick={onOpenOwnerPortal}
              className="inline-flex items-center gap-1.5 px-3 min-h-[44px] sm:min-h-[36px] bg-emerald-950/60 border border-emerald-800 text-emerald-400 hover:bg-emerald-900/60 hover:-translate-y-0.5 text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Gmail Dispatch Console</span>
            </button>
          )}
        </div>

        {/* Right Copyright & Powered By Kundan (subtle owner trigger) */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1">
          <span>&copy; 2035 by KundanVerse. Powered and secured by</span>
          <button
            type="button"
            onClick={onOpenOwnerPortal}
            className="text-white font-normal hover:underline cursor-pointer bg-transparent border-0 px-1 min-h-[44px] sm:min-h-0 inline-flex items-center"
            title="Site Owner Access"
          >
            Kundan
          </button>
        </div>
      </div>
    </footer>
  );
};
