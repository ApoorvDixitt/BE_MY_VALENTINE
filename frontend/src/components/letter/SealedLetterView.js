import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ShareWidget from '../ShareWidget';

export default function SealedLetterView({ content, isOpened, markOpened }) {
  const [envelopeOpen, setEnvelopeOpen] = useState(isOpened);
  const [showLetter, setShowLetter] = useState(isOpened);

  const handleOpen = async () => {
    setEnvelopeOpen(true);
    await markOpened();
    setTimeout(() => setShowLetter(true), 900);
  };

  const formatContent = (text) => {
    return text.split('\n\n').map((para, i) => (
      <p key={i}>{para.split('\n').map((line, j) => (
        <React.Fragment key={j}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ))}</p>
    ));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <AnimatePresence mode="wait">
        {!envelopeOpen ? (
          /* Sealed envelope state */
          <motion.div
            key="envelope"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Envelope */}
            <div className="relative w-[280px] sm:w-[340px] h-[200px] sm:h-[240px] mx-auto mb-8">
              {/* Envelope body */}
              <div className="absolute inset-0 rounded-xl bg-[hsl(var(--ritual-blush))] border border-[rgba(58,13,30,0.12)] shadow-[0_18px_46px_rgba(58,13,30,0.15)]">
                {/* Inner shadow / paper texture feel */}
                <div className="absolute inset-4 rounded-lg bg-[hsl(var(--ritual-parchment))] opacity-50" />
              </div>
              
              {/* Envelope flap (triangle) */}
              <div
                className="absolute top-0 left-0 right-0 h-[100px] sm:h-[120px] overflow-hidden"
                style={{ perspective: '600px' }}
              >
                <div
                  className="w-0 h-0 mx-auto"
                  style={{
                    borderLeft: '140px solid transparent',
                    borderRight: '140px solid transparent',
                    borderTop: '100px solid hsl(352, 36%, 85%)',
                    filter: 'drop-shadow(0 2px 4px rgba(58,13,30,0.1))'
                  }}
                />
              </div>

              {/* Wax seal */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--ritual-wine))] shadow-[0_4px_16px_rgba(58,13,30,0.3)] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="hsl(36, 60%, 96%)" opacity="0.9" />
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="font-[var(--font-display)] text-xl sm:text-2xl text-foreground mb-3">
              A letter is waiting for you.
            </h2>
            <p className="text-sm text-foreground/50 mb-6">
              Break the seal to read it.
            </p>

            <button
              data-testid="sealed-letter-open-button"
              onClick={handleOpen}
              className="h-11 px-6 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))] font-[var(--font-ui)] text-sm"
              style={{ transition: 'background-color 0.2s, box-shadow 0.2s' }}
            >
              Open the envelope
            </button>

            <div className="mt-4">
              <button
                data-testid="sealed-letter-skip-animation-button"
                onClick={() => {
                  markOpened();
                  setEnvelopeOpen(true);
                  setShowLetter(true);
                }}
                className="text-xs text-foreground/30 hover:text-foreground/50"
              >
                Open instantly
              </button>
            </div>
          </motion.div>
        ) : !showLetter ? (
          /* Opening animation */
          <motion.div
            key="opening"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: -40, opacity: 0.5 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-[280px] sm:w-[340px] h-[200px] sm:h-[240px] mx-auto rounded-xl bg-[hsl(var(--ritual-blush))] border border-[rgba(58,13,30,0.12)] shadow-[0_18px_46px_rgba(58,13,30,0.15)]"
            />
          </motion.div>
        ) : (
          /* Letter revealed */
          <motion.div
            key="letter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-[640px]"
          >
            <div className="relative paper-noise bg-[hsl(var(--ritual-parchment))] rounded-2xl shadow-[inset_0_0_0_1px_rgba(58,13,30,0.08),0_18px_46px_rgba(58,13,30,0.10)] border-t border-[rgba(58,13,30,0.10)]">
              <div className="relative z-10 p-6 sm:p-10">
                <div className="letter-text space-y-5">
                  {formatContent(content)}
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-xs text-foreground/30">
                This letter was written for you. Handle it gently.
              </p>
            </div>

            <ShareWidget />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
