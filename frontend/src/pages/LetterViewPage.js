import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import SealedLetterView from '../components/letter/SealedLetterView';
import TimedRevealView from '../components/letter/TimedRevealView';
import UnsentLetterView from '../components/letter/UnsentLetterView';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function LetterViewPage() {
  const { type, token } = useParams();
  const [letterData, setLetterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/letters/${token}`);
        setLetterData(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('This letter could not be found. It may have expired or the link may be incorrect.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLetter();
  }, [token]);

  const markOpened = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/letters/${token}/open`);
      // Update letterData with content returned from open endpoint
      if (res.data && res.data.content) {
        setLetterData(prev => ({
          ...prev,
          content: res.data.content,
          is_opened: true,
          is_locked: false
        }));
      } else {
        // Fallback: re-fetch the letter to get content
        const fetchRes = await axios.get(`${BACKEND_URL}/api/letters/${token}`);
        setLetterData(fetchRes.data);
      }
    } catch (err) {
      console.error('Error marking letter as opened:', err);
      // Still try to re-fetch content
      try {
        const fetchRes = await axios.get(`${BACKEND_URL}/api/letters/${token}`);
        setLetterData(fetchRes.data);
      } catch (fetchErr) {
        console.error('Error re-fetching letter:', fetchErr);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.p
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="font-[var(--font-display)] text-lg text-foreground/50"
        >
          Finding your letter...
        </motion.p>
      </div>
    );
  }

  if (error || !letterData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-[400px] text-center">
          <p className="font-[var(--font-display)] text-lg text-foreground/70 mb-4">
            {error || 'Letter not found.'}
          </p>
          <a href="/" className="text-sm text-[hsl(var(--ritual-wine))] underline">
            Return home
          </a>
        </div>
      </div>
    );
  }

  // Handle expired / closure
  if (letterData.is_expired || (letterData.closure_message && !letterData.content)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[440px] text-center"
        >
          <p className="font-[var(--font-display)] text-xl text-foreground/60 leading-relaxed">
            {letterData.closure_message || 'This letter has returned to the silence it came from.'}
          </p>
        </motion.div>
      </div>
    );
  }

  const viewProps = {
    content: letterData.content,
    deliveryType: letterData.delivery_type,
    isOpened: letterData.is_opened,
    isLocked: letterData.is_locked,
    revealAt: letterData.reveal_at,
    token,
    markOpened
  };

  switch (type) {
    case 'sealed':
      return <SealedLetterView {...viewProps} />;
    case 'timed':
      return <TimedRevealView {...viewProps} />;
    case 'unsent':
      return <UnsentLetterView {...viewProps} />;
    default:
      return <SealedLetterView {...viewProps} />;
  }
}
