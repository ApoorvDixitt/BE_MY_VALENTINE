import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../../App';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Lock, Clock, Eye } from 'lucide-react';

const deliveryOptions = [
  {
    id: 'sealed',
    title: 'Sealed Valentine Page',
    desc: 'A private link with an envelope opening animation. Can be opened once — like breaking a wax seal.',
    icon: Lock,
    detail: 'Share the link. They open the envelope. The letter reveals.',
  },
  {
    id: 'timed',
    title: 'Timed Reveal',
    desc: 'The letter unlocks at a moment you choose. Expires 24 hours after revealing.',
    icon: Clock,
    detail: 'Set the date and time. The link shows a countdown until then.',
  },
  {
    id: 'unsent',
    title: 'Unsent Letter',
    desc: 'Read it once. Then it fades. A ritual of letting go — no sharing, no saving.',
    icon: Eye,
    detail: 'This letter is for you alone. It exists once, then disappears.',
  },
];

export default function DeliveryStep() {
  const navigate = useNavigate();
  const { flowData, updateFlow } = useFlow();
  const [selected, setSelected] = useState(flowData.delivery_type || 'sealed');
  const [revealDate, setRevealDate] = useState(flowData.reveal_at ? flowData.reveal_at.split('T')[0] : '');
  const [revealTime, setRevealTime] = useState(flowData.reveal_at ? flowData.reveal_at.split('T')[1]?.slice(0, 5) : '20:00');

  const handleNext = () => {
    let reveal_at = null;
    if (selected === 'timed' && revealDate) {
      // Issue #7: Convert local datetime to UTC ISO string
      const localDatetime = `${revealDate}T${revealTime || '20:00'}:00`;
      reveal_at = new Date(localDatetime).toISOString();
    }
    updateFlow({ delivery_type: selected, reveal_at });
    navigate('/flow/payment');
  };

  return (
    <div>
      <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl text-foreground mb-2">
        How should it arrive?
      </h2>
      <p className="text-sm text-foreground/60 mb-8">
        Choose how your letter will be experienced.
      </p>

      <div className="space-y-3">
        {deliveryOptions.map((opt, i) => (
          <motion.button
            key={opt.id}
            data-testid={`delivery-option-card-${opt.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            onClick={() => setSelected(opt.id)}
            className={`w-full text-left relative overflow-hidden rounded-xl bg-card paper-noise border p-5 cursor-pointer ${
              selected === opt.id
                ? 'border-[hsl(var(--ritual-wine))] shadow-[0_0_0_1px_hsl(var(--ritual-wine)),0_12px_30px_rgba(58,13,30,0.12)]'
                : 'border-[hsl(var(--border))] shadow-[0_12px_30px_rgba(58,13,30,0.06)] hover:border-[hsl(var(--ritual-wine))]/50'
            }`}
            style={{ transition: 'border-color 0.25s, box-shadow 0.25s' }}
          >
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[hsl(var(--ritual-blush))] flex items-center justify-center">
                <opt.icon className="w-4 h-4 text-[hsl(var(--ritual-wine))]" />
              </div>
              <div>
                <h3 className="font-[var(--font-display)] text-base sm:text-lg text-foreground mb-1">
                  {opt.title}
                </h3>
                <p className="text-sm text-foreground/50 mb-1">{opt.desc}</p>
                {selected === opt.id && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs text-foreground/40 italic"
                  >
                    {opt.detail}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Timed reveal date picker */}
      {selected === 'timed' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 rounded-xl border border-[hsl(var(--border))] bg-card"
        >
          <p className="text-sm text-foreground/70 mb-3 font-[var(--font-ui)]">
            When should this letter reveal?
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-foreground/50 mb-1 block">Date</label>
              <input
                data-testid="timed-reveal-date"
                type="date"
                value={revealDate}
                onChange={(e) => setRevealDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--ritual-parchment))] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ritual-candle))]"
              />
            </div>
            <div className="w-[120px]">
              <label className="text-xs text-foreground/50 mb-1 block">Time</label>
              <input
                data-testid="timed-reveal-time"
                type="time"
                value={revealTime}
                onChange={(e) => setRevealTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--ritual-parchment))] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ritual-candle))]"
              />
            </div>
          </div>
          <p className="text-xs text-foreground/40 mt-2">Your local timezone will be used.</p>
        </motion.div>
      )}

      {/* Next button */}
      <div className="pt-6">
        <Button
          data-testid="delivery-next-button"
          onClick={handleNext}
          disabled={selected === 'timed' && !revealDate}
          className="w-full h-12 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))] disabled:opacity-50"
        >
          Continue to payment
        </Button>
      </div>
    </div>
  );
}
