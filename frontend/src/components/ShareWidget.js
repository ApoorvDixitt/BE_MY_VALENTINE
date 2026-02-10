import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

// A/B testable headlines — randomly picks one per session
const HEADLINES = [
  "Okay. Now it's your turn.",
  "You weren't supposed to be the only one.",
  "Someone you know needs this too.",
];

const SUBTEXTS = [
  "You know exactly who would read this seriously.",
  "Don't explain it. Just send it.",
];

const SHARE_URL = typeof window !== 'undefined' ? window.location.origin : "https://letrr.me";

const SHARE_MESSAGES = {
  whatsapp: {
    en: "Do this. Don't ask me what it is.",
    hi: "Bas try kar. Baad mein baat karte hain.",
  },
  x: {
    en: "Do this. Don't ask me what it is.",
    hi: "Bas try kar. Baad mein baat karte hain.",
  },
};

export default function ShareWidget() {
  const [visible, setVisible] = useState(false);
  const [headline] = useState(() => HEADLINES[Math.floor(Math.random() * HEADLINES.length)]);
  const [subtext] = useState(() => SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)]);

  // Fade in after delay
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`${SHARE_MESSAGES.whatsapp.en}\n${SHARE_URL}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(SHARE_URL);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = SHARE_URL;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast("Someone's about to fall for it.", {
        duration: 3000,
        style: {
          background: 'hsl(36, 56%, 97%)',
          color: 'hsl(16, 36%, 12%)',
          border: '1px solid hsl(18, 20%, 78%)',
          fontFamily: 'var(--font-ui)',
          fontSize: '13px',
        },
      });
    } catch {
      window.prompt('Copy this link:', SHARE_URL);
    }
  };

  const handleInstagramDM = () => {
    // Instagram doesn't have a direct DM share URL, so we copy link + open Instagram
    handleCopyLink();
    window.open('https://instagram.com', '_blank');
  };

  const handleX = () => {
    const msg = encodeURIComponent(`${SHARE_MESSAGES.x.en}\n${SHARE_URL}`);
    window.open(`https://x.com/intent/tweet?text=${msg}`, '_blank');
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="w-full max-w-[480px] mx-auto mt-12 mb-8 px-4"
    >
      <div className="border-t border-[hsl(var(--border))]/50 pt-8">
        {/* Headline */}
        <p className="font-[var(--font-display)] text-lg sm:text-xl text-foreground/80 text-center mb-2">
          {headline}
        </p>

        {/* Subtext */}
        <p className="text-sm text-foreground/45 text-center mb-7">
          {subtext}
        </p>

        {/* Primary buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
          <button
            onClick={handleWhatsApp}
            data-testid="share-whatsapp"
            className="flex-1 h-10 px-4 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] text-sm font-[var(--font-ui)] flex items-center justify-center gap-2 hover:bg-[hsl(var(--ritual-wine-deep))]"
            style={{ transition: 'background-color 0.2s' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Send quietly
          </button>

          <button
            onClick={handleCopyLink}
            data-testid="share-copy-link"
            className="flex-1 h-10 px-4 rounded-xl bg-[hsl(var(--ritual-parchment))] text-foreground/70 text-sm font-[var(--font-ui)] border border-[hsl(var(--border))] flex items-center justify-center gap-2 hover:border-[hsl(var(--ritual-wine))]/50 hover:text-foreground/90"
            style={{ transition: 'border-color 0.2s, color 0.2s' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Pass it on
          </button>
        </div>

        {/* Secondary buttons */}
        <div className="flex gap-2.5 mb-6">
          <button
            onClick={handleInstagramDM}
            data-testid="share-instagram"
            className="flex-1 h-9 px-3 rounded-xl text-foreground/40 text-xs font-[var(--font-ui)] border border-[hsl(var(--border))]/50 flex items-center justify-center gap-1.5 hover:text-foreground/60 hover:border-[hsl(var(--border))]"
            style={{ transition: 'border-color 0.2s, color 0.2s' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            Let them read
          </button>

          <button
            onClick={handleX}
            data-testid="share-x"
            className="flex-1 h-9 px-3 rounded-xl text-foreground/40 text-xs font-[var(--font-ui)] border border-[hsl(var(--border))]/50 flex items-center justify-center gap-1.5 hover:text-foreground/60 hover:border-[hsl(var(--border))]"
            style={{ transition: 'border-color 0.2s, color 0.2s' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Pass it on
          </button>
        </div>

        {/* Microcopy */}
        <p className="text-xs text-foreground/30 text-center italic">
          Starts sincere. Ends… differently.
        </p>
        <p className="text-[11px] text-foreground/25 text-center mt-2">
          P.S. Don't warn them.
        </p>
      </div>
    </motion.div>
  );
}
