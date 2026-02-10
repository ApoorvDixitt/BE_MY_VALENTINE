import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function CompletePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const getLetterUrl = () => {
    if (!order?.letter_token) return '';
    return `${window.location.origin}/letter/${order.delivery_type}/${order.letter_token}`;
  };

  const copyLink = async () => {
    const url = getLetterUrl();
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback: create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: prompt the user to copy manually
      try {
        window.prompt('Copy this link:', url);
      } catch {
        toast.error('Could not copy. Please select and copy the link manually.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/50 animate-gentle-pulse">Loading...</p>
      </div>
    );
  }

  if (!order || !order.letter_ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/60 mb-4">Your letter is still being written...</p>
          <button
            onClick={() => navigate(`/flow/generating/${orderId}`)}
            className="text-sm text-[hsl(var(--ritual-wine))] underline"
          >
            Go back to watch
          </button>
        </div>
      </div>
    );
  }

  const deliveryMessages = {
    sealed: 'Your sealed letter is ready. Share this private link — it can be opened once.',
    timed: `Your timed letter is set. It will reveal at the moment you chose.`,
    unsent: 'Your letter exists now, just once. Open it when you\'re ready — it will fade after reading.'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center"
    >
      <div className="max-w-[480px] w-full mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Seal icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[hsl(var(--ritual-wine))] flex items-center justify-center shadow-[0_8px_24px_rgba(58,13,30,0.25)]">
            <Check className="w-7 h-7 text-[hsl(var(--primary-foreground))]" />
          </div>

          <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl text-foreground mb-3">
            Your letter is written.
          </h1>

          <p className="text-sm text-foreground/60 leading-relaxed mb-8">
            {deliveryMessages[order.delivery_type] || deliveryMessages.sealed}
          </p>

          {/* Letter link */}
          <div className="relative rounded-xl bg-card border border-[hsl(var(--border))] p-4 paper-noise mb-6">
            <p className="text-xs text-foreground/40 mb-2 relative z-10">Your private link</p>
            <p 
              className="text-sm text-foreground/80 font-mono break-all relative z-10 select-all cursor-text"
              onClick={(e) => {
                // Select all text on click for easy manual copying
                const range = document.createRange();
                range.selectNodeContents(e.target);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
              }}
            >
              {getLetterUrl()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              data-testid="letter-copy-link-button"
              onClick={copyLink}
              variant="outline"
              className="h-11 px-5 rounded-xl bg-[hsl(var(--ritual-parchment))] border-[hsl(var(--border))] hover:border-[hsl(var(--ritual-wine))]"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>

            <Button
              data-testid="letter-open-button"
              onClick={() => navigate(`/letter/${order.delivery_type}/${order.letter_token}`)}
              className="h-11 px-5 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open your letter
            </Button>
          </div>

          <div className="mt-10">
            <button
              onClick={() => {
                navigate('/');
              }}
              className="text-xs text-foreground/40 hover:text-foreground/60"
            >
              Write another letter
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
