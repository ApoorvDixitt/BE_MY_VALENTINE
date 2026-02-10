import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ShareWidget from '../ShareWidget';

export default function UnsentLetterView({ content, isOpened, markOpened }) {
  const [phase, setPhase] = useState(isOpened ? 'closure' : 'reading');
  const [fadeProgress, setFadeProgress] = useState(0);
  const [hasMarkedOpen, setHasMarkedOpen] = useState(isOpened);
  const timerRef = useRef(null);

  // Mark as opened when component mounts (if not already)
  useEffect(() => {
    if (!hasMarkedOpen && phase === 'reading') {
      markOpened();
      setHasMarkedOpen(true);
    }
  }, [hasMarkedOpen, markOpened, phase]);

  const handleLetGo = () => {
    // Start fade animation
    const startTime = Date.now();
    const duration = 3000; // 3 second fade

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setFadeProgress(progress);

      if (progress < 1) {
        timerRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('closure');
      }
    };

    timerRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, []);

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

  if (phase === 'closure') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          data-testid="unsent-letter-closure-message"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center max-w-[440px]"
        >
          <p className="font-[var(--font-display)] text-xl sm:text-2xl text-foreground/50 leading-relaxed">
            Some words are meant to be felt once, and then let go.
          </p>
          <div className="mt-10">
            <a
              href="/"
              className="text-xs text-foreground/30 hover:text-foreground/50"
            >
              Return home
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        data-testid="unsent-letter-reader"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-full max-w-[640px]"
        style={{
          opacity: 1 - fadeProgress * 0.9,
          filter: `blur(${fadeProgress * 8}px)`,
        }}
      >
        <div className="relative paper-noise bg-[hsl(var(--ritual-parchment))] rounded-2xl shadow-[inset_0_0_0_1px_rgba(58,13,30,0.08),0_18px_46px_rgba(58,13,30,0.10)] border-t border-[rgba(58,13,30,0.10)]">
          <div className="relative z-10 p-6 sm:p-10">
            <div className="letter-text space-y-5">
              {formatContent(content)}
            </div>
          </div>
        </div>

        {/* Fade progress indicator */}
        {fadeProgress > 0 && (
          <div className="mt-4 w-full max-w-[200px] mx-auto">
            <div className="h-0.5 bg-[hsl(var(--border))] rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground/30 rounded-full"
                style={{ width: `${fadeProgress * 100}%`, transition: 'none' }}
              />
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          {fadeProgress === 0 && (
            <>
              <p className="text-xs text-foreground/40 mb-4">
                This letter exists once. When you're ready, let it go.
              </p>
              <button
                data-testid="unsent-letter-let-go-button"
                onClick={handleLetGo}
                className="text-sm text-foreground/50 hover:text-foreground/70 border border-[hsl(var(--border))] rounded-xl px-5 py-2"
                style={{ transition: 'color 0.2s, border-color 0.2s' }}
              >
                Let go
              </button>
            </>
          )}
        </div>

        {fadeProgress === 0 && <ShareWidget />}
      </motion.div>
    </div>
  );
}
