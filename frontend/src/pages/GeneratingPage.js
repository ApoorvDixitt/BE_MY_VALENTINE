import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '../components/ui/progress';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RITUAL_MESSAGES = [
  'Warming the ink\u2026',
  'Folding the page\u2026',
  'Sealing what\'s true\u2026',
  'Placing it somewhere safe\u2026'
];

export default function GeneratingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [orderFailed, setOrderFailed] = useState(false);
  const pollRef = useRef(null);
  const startTime = useRef(Date.now());

  // Animate progress and cycle messages
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Slow progress that never quite reaches 100 until done
        const elapsed = (Date.now() - startTime.current) / 1000;
        const target = Math.min(90, elapsed * 3);
        return prev + (target - prev) * 0.1;
      });
    }, 200);

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % RITUAL_MESSAGES.length);
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  // Poll for completion
  const pollCountRef = useRef(0);
  const MAX_POLLS = 120;

  useEffect(() => {
    const poll = async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLLS) {
        setError('Letter generation is taking longer than expected. Please try refreshing or contact support.');
        return;
      }

      try {
        const res = await axios.get(`${BACKEND_URL}/api/orders/${orderId}`);
        const data = res.data;

        if (data.status === 'complete' && data.letter_ready && data.letter_token) {
          setProgress(100);
          setTimeout(() => {
            navigate(`/flow/complete/${orderId}`);
          }, 800);
          return;
        }

        if (data.status === 'failed') {
          setError(null);
          setOrderFailed(true);
          return;
        }

        // Continue polling
        pollRef.current = setTimeout(poll, 2000);
      } catch (err) {
        console.error('Poll error:', err);
        // Issue #20: Stop on 404/500 instead of infinite loop
        if (err.response?.status === 404) {
          setError('Order not found. Please contact support if you completed payment.');
          return;
        }
        if (err.response?.status >= 500) {
          setError('Server error. Please try refreshing.');
          return;
        }
        pollRef.current = setTimeout(poll, 3000);
      }
    };

    pollRef.current = setTimeout(poll, 3000);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [orderId, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="max-w-[400px] w-full mx-auto px-6 text-center">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-foreground/70 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[hsl(var(--ritual-wine))] underline"
            >
              Start over
            </button>
          </motion.div>
        ) : orderFailed ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-foreground/70 mb-4">Something went wrong while writing your letter.</p>
            <button
              data-testid="retry-generation-button"
              onClick={async () => {
                setOrderFailed(false);
                try {
                  await axios.post(`${BACKEND_URL}/api/orders/${orderId}/retry-generation`);
                  pollCountRef.current = 0;
                  const repoll = () => {
                    pollRef.current = setTimeout(async () => {
                      try {
                        const res = await axios.get(`${BACKEND_URL}/api/orders/${orderId}`);
                        if (res.data.status === 'complete' && res.data.letter_ready) {
                          setProgress(100);
                          setTimeout(() => navigate(`/flow/complete/${orderId}`), 800);
                        } else if (res.data.status === 'failed') {
                          setOrderFailed(true);
                        } else {
                          repoll();
                        }
                      } catch { repoll(); }
                    }, 2000);
                  };
                  repoll();
                } catch (err) {
                  setError(err.response?.data?.detail || 'Retry failed. Please contact support.');
                }
              }}
              className="text-sm text-[hsl(var(--ritual-wine))] underline mb-3 block mx-auto"
            >
              Try again
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-foreground/40 underline"
            >
              Start over
            </button>
          </motion.div>
        ) : (
          <>
            {/* Animated writing icon */}
            <motion.div
              className="w-16 h-16 mx-auto mb-8 rounded-full bg-[hsl(var(--ritual-blush))] flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="hsl(346, 63%, 22%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </motion.div>

            {/* Ritual message */}
            <div className="h-8 mb-6">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  data-testid="generation-status-text"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="font-[var(--font-display)] text-lg text-foreground/70"
                >
                  {RITUAL_MESSAGES[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div data-testid="generation-progress" className="w-full max-w-[280px] mx-auto">
              <Progress
                value={progress}
                className="h-1.5 bg-[hsl(var(--ritual-blush))]"
              />
            </div>

            {/* Skeleton lines */}
            <div className="mt-10 space-y-3 opacity-30">
              {[85, 100, 70, 90, 60].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-2 bg-[hsl(var(--border))] rounded-full mx-auto"
                  style={{ width: `${w}%` }}
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
