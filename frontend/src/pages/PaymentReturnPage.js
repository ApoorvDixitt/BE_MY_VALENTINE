import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PaymentReturnPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Confirming your payment...');
  const pollRef = useRef(null);
  const pollCount = useRef(0);
  const MAX_POLLS = 30; // 30 polls * 2s = 60 seconds max wait

  useEffect(() => {
    const orderId = searchParams.get('order_id') || localStorage.getItem('unsent-valentine-pending-order');

    if (!orderId) {
      setStatus('error');
      setMessage('Could not find your order. Please try again.');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/orders/${orderId}`);
        const data = res.data;

        if (data.payment_confirmed) {
          // Payment confirmed by webhook
          setStatus('confirmed');
          setMessage('Payment confirmed. Writing your letter...');
          localStorage.removeItem('unsent-valentine-pending-order');

          // Navigate to generating page
          setTimeout(() => {
            navigate(`/flow/generating/${orderId}`);
          }, 1500);
          return;
        }

        if (data.status === 'payment_failed') {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again.');
          localStorage.removeItem('unsent-valentine-pending-order');
          return;
        }

        if (data.status === 'payment_cancelled') {
          setStatus('cancelled');
          setMessage('Payment was cancelled.');
          localStorage.removeItem('unsent-valentine-pending-order');
          return;
        }

        // Still waiting for webhook
        pollCount.current += 1;
        if (pollCount.current >= MAX_POLLS) {
          setStatus('timeout');
          setMessage('Payment confirmation is taking longer than expected. Your letter will be ready when payment is confirmed.');
          return;
        }

        setMessage('Confirming your payment...');
        pollRef.current = setTimeout(checkStatus, 2000);
      } catch (err) {
        console.error('Status check error:', err);
        pollCount.current += 1;
        if (pollCount.current < MAX_POLLS) {
          pollRef.current = setTimeout(checkStatus, 3000);
        }
      }
    };

    // Start polling after a brief delay (give webhook time)
    pollRef.current = setTimeout(checkStatus, 2000);

    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [searchParams, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center px-6"
    >
      <div className="max-w-[400px] w-full text-center">
        {status === 'checking' && (
          <>
            <motion.div
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-[hsl(var(--ritual-blush))] flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="hsl(346, 63%, 22%)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </motion.div>
            <p className="font-[var(--font-display)] text-lg text-foreground/70">{message}</p>
            <p className="text-xs text-foreground/40 mt-3">This may take a moment.</p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[hsl(var(--ritual-wine))] flex items-center justify-center shadow-[0_8px_24px_rgba(58,13,30,0.25)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="hsl(36, 60%, 96%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="font-[var(--font-display)] text-lg text-foreground/70">{message}</p>
          </>
        )}

        {(status === 'failed' || status === 'cancelled') && (
          <>
            <p className="font-[var(--font-display)] text-lg text-foreground/70 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[hsl(var(--ritual-wine))] underline"
            >
              Start over
            </button>
          </>
        )}

        {status === 'timeout' && (
          <>
            <p className="font-[var(--font-display)] text-lg text-foreground/70 mb-4">{message}</p>
            <p className="text-xs text-foreground/40 mb-6">
              Check your email for confirmation, or try refreshing this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-[hsl(var(--ritual-wine))] underline"
            >
              Refresh
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="font-[var(--font-display)] text-lg text-foreground/70 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-[hsl(var(--ritual-wine))] underline"
            >
              Return home
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
