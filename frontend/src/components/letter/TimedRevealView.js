import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ShareWidget from '../ShareWidget';

export default function TimedRevealView({ content, isLocked, revealAt, isOpened, markOpened }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [unlocked, setUnlocked] = useState(!isLocked);
  const [showLetter, setShowLetter] = useState(isOpened && !!content);
  const [opening, setOpening] = useState(false);

  // React to content prop changes (e.g. after markOpened updates parent state)
  useEffect(() => {
    if (content && opening) {
      setShowLetter(true);
      setOpening(false);
    }
  }, [content, opening]);

  useEffect(() => {
    // If already opened and has content, show letter directly
    if (isOpened && content) {
      setUnlocked(true);
      setShowLetter(true);
      return;
    }

    if (!isLocked || !revealAt) {
      setUnlocked(true);
      return;
    }

    const targetTime = new Date(revealAt).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setUnlocked(true);
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isLocked, revealAt, isOpened, content]);

  const handleReveal = async () => {
    setOpening(true);
    await markOpened();
    // showLetter will be set by the useEffect when content prop updates
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

  // Locked state - countdown
  if (!unlocked && timeLeft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-[440px]"
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-[hsl(var(--ritual-blush))] flex items-center justify-center"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="hsl(346, 63%, 22%)" strokeWidth="1.5" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="hsl(346, 63%, 22%)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.div>

          <h2 className="font-[var(--font-display)] text-xl sm:text-2xl text-foreground mb-3">
            This letter is waiting for its moment.
          </h2>

          {/* Countdown */}
          <div data-testid="timed-reveal-countdown" className="flex justify-center gap-4 my-8">
            {[
              { value: timeLeft.days, label: 'days' },
              { value: timeLeft.hours, label: 'hours' },
              { value: timeLeft.minutes, label: 'min' },
              { value: timeLeft.seconds, label: 'sec' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-card border border-[hsl(var(--border))] flex items-center justify-center mb-1 shadow-[0_4px_12px_rgba(58,13,30,0.06)]">
                  <span className="font-[var(--font-display)] text-xl text-foreground">
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] text-foreground/40">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground/50">
            It will reveal on {new Date(revealAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at {new Date(revealAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.
          </p>
        </motion.div>
      </div>
    );
  }

  // Unlocked but not yet opened
  if (unlocked && !showLetter && !isOpened) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-[440px]"
          data-testid="timed-reveal-unlocked-state"
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-[hsl(var(--ritual-wine))] flex items-center justify-center shadow-[0_8px_24px_rgba(58,13,30,0.25)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="hsl(36, 60%, 96%)" strokeWidth="1.5" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="hsl(36, 60%, 96%)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </motion.div>

          <h2 className="font-[var(--font-display)] text-xl sm:text-2xl text-foreground mb-3">
            The moment has arrived.
          </h2>
          <p className="text-sm text-foreground/50 mb-6">
            Your letter is ready to be read.
          </p>

          <button
            data-testid="timed-reveal-open-button"
            onClick={handleReveal}
            className="h-11 px-6 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))] font-[var(--font-ui)] text-sm"
            style={{ transition: 'background-color 0.2s, box-shadow 0.2s' }}
          >
            Read my letter
          </button>
        </motion.div>
      </div>
    );
  }

  // Letter visible
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
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
            This letter will be available for 24 hours.
          </p>
        </div>

        <ShareWidget />
      </motion.div>
    </div>
  );
}
