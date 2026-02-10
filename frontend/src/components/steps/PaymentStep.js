import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../../App';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Lock, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LANGUAGE_LABELS = {
  english: 'English',
  hindi: 'Hindi',
  hinglish: 'Hinglish',
};

export default function PaymentStep() {
  const navigate = useNavigate();
  const { flowData, resetFlow } = useFlow();
  const [processing, setProcessing] = useState(false);
  const [pricing, setPricing] = useState({ display: '$6.99', symbol: '$', price: 6.99, currency: 'USD', country: 'US' });

  // Fetch geo-based pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/pricing`);
        setPricing(res.data);
      } catch (err) {
        console.error('Pricing fetch error:', err);
      }
    };
    fetchPricing();
  }, []);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Step 1: Create order
      const orderRes = await axios.post(`${BACKEND_URL}/api/orders`, {
        context: flowData.context,
        name: flowData.name || '',
        feelings: flowData.feelings || '',
        missing: flowData.missing || '',
        memory: flowData.memory || '',
        unsaid: flowData.unsaid || '',
        tone: flowData.tone || 'gentle-romantic',
        delivery_type: flowData.delivery_type || 'sealed',
        reveal_at: flowData.reveal_at || null,
        language: flowData.language || 'english',
      });

      const orderId = orderRes.data.order_id;

      // Step 2: Try Dodo checkout first, then mock fallback
      const checkoutUrl = await createCheckout(orderId);
      
      if (checkoutUrl) {
        // Dodo checkout — redirect to payment gateway
        localStorage.setItem('unsent-valentine-pending-order', orderId);
        resetFlow();
        window.location.href = checkoutUrl;
      } else {
        // Mock fallback (only works if PAYMENT_MODE=mock on backend)
        try {
          await axios.post(`${BACKEND_URL}/api/orders/${orderId}/pay/mock-success`);
          resetFlow();
          navigate(`/flow/generating/${orderId}`);
        } catch (mockErr) {
          toast.error('Payment is currently unavailable. Please try again shortly.');
          setProcessing(false);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      localStorage.removeItem('unsent-valentine-flow');  // Issue #16: clear stale data on error
      toast.error('Something went wrong. Please try again.');
      setProcessing(false);
    }
  };

  const createCheckout = async (orderId) => {
    try {
      const checkoutRes = await axios.post(`${BACKEND_URL}/api/checkout/create`, {
        order_id: orderId,
        country: pricing.country || 'US',
      });

      if (checkoutRes.data && checkoutRes.data.checkout_url) {
        return checkoutRes.data.checkout_url;
      }
      console.warn('Checkout response missing checkout_url:', checkoutRes.data);
      return null;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      console.error('Checkout creation failed:', errorMsg);
      // Don't silently swallow - log for debugging
      if (err.response?.status === 500) {
        console.error('Server error creating checkout. Backend may not have payment credentials configured.');
      }
      return null;
    }
  };

  return (
    <div>
      <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl text-foreground mb-2">
        Your letter awaits.
      </h2>
      <p className="text-sm text-foreground/60 mb-8">
        This letter is written once, for one person.
      </p>

      {/* Order summary card */}
      <div className="relative overflow-hidden rounded-xl bg-card paper-noise border border-[hsl(var(--border))] p-6 mb-6">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <span className="font-[var(--font-display)] text-lg text-foreground">Valentine Letter</span>
            <span className="font-[var(--font-display)] text-2xl text-foreground">{pricing.display}</span>
          </div>

          <div className="space-y-2 text-sm text-foreground/60">
            <div className="flex justify-between">
              <span>Story</span>
              <span className="text-foreground/80">
                {flowData.context === 'long-distance' && 'Long-distance love'}
                {flowData.context === 'miss-cant-talk' && "Someone I miss"}
                {flowData.context === 'lost' && 'Someone I lost'}
                {flowData.context === 'valentine-partner' && 'Valentine for partner'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Language</span>
              <span className="text-foreground/80">
                {LANGUAGE_LABELS[flowData.language] || 'English'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tone</span>
              <span className="text-foreground/80">
                {flowData.tone === 'gentle-romantic' && 'Gentle & romantic'}
                {flowData.tone === 'deep-emotional' && 'Deep & emotional'}
                {flowData.tone === 'poetic-dreamy' && 'Poetic & dreamy'}
                {flowData.tone === 'honest-raw' && 'Honest & raw'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="text-foreground/80">
                {flowData.delivery_type === 'sealed' && 'Sealed envelope'}
                {flowData.delivery_type === 'timed' && 'Timed reveal'}
                {flowData.delivery_type === 'unsent' && 'Unsent letter'}
              </span>
            </div>
            {flowData.name && (
              <div className="flex justify-between">
                <span>For</span>
                <span className="text-foreground/80">{flowData.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security indicators */}
      <div className="flex items-center gap-4 mb-6 text-foreground/40">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs">Secure checkout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs">Encrypted & private</span>
        </div>
      </div>

      {/* Pay button */}
      <Button
        data-testid="payment-pay-button"
        onClick={handlePayment}
        disabled={processing}
        className="w-full h-12 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))] disabled:opacity-60"
      >
        {processing ? 'Preparing checkout...' : `Unlock my letter \u2014 ${pricing.display}`}
      </Button>

      <p className="text-xs text-foreground/40 text-center mt-4">
        One-time payment. No subscription. No account needed.
      </p>
    </div>
  );
}
