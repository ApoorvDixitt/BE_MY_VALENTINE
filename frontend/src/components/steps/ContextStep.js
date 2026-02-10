import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../../App';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, CloudOff, Sparkles } from 'lucide-react';

const contexts = [
  {
    id: 'long-distance',
    title: 'Long-distance love',
    desc: 'For someone who is far away, but always close.',
    icon: Heart,
  },
  {
    id: 'miss-cant-talk',
    title: "Someone I miss but can't talk to",
    desc: 'For the conversations that ended too soon.',
    icon: MessageCircle,
  },
  {
    id: 'lost',
    title: 'Someone I lost',
    desc: 'For the ones who are no longer here.',
    icon: CloudOff,
  },
  {
    id: 'valentine-partner',
    title: 'Valentine letter for my partner',
    desc: 'For the love that\'s right here, right now.',
    icon: Sparkles,
  },
];

export default function ContextStep() {
  const navigate = useNavigate();
  const { flowData, updateFlow } = useFlow();

  const selectContext = (contextId) => {
    updateFlow({ context: contextId });
    navigate('/flow/inputs');
  };

  return (
    <div>
      <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl text-foreground mb-2">
        Who is this letter for?
      </h2>
      <p className="text-sm text-foreground/60 mb-8">
        Choose the story closest to yours.
      </p>

      <div className="space-y-3">
        {contexts.map((ctx, i) => (
          <motion.button
            key={ctx.id}
            data-testid={`context-option-card-${ctx.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            onClick={() => selectContext(ctx.id)}
            className={`w-full text-left relative overflow-hidden rounded-xl bg-card paper-noise border p-5 group cursor-pointer ${
              flowData.context === ctx.id
                ? 'border-[hsl(var(--ritual-wine))] shadow-[0_0_0_1px_hsl(var(--ritual-wine)),0_12px_30px_rgba(58,13,30,0.12)]'
                : 'border-[hsl(var(--border))] shadow-[0_12px_30px_rgba(58,13,30,0.06)] hover:border-[hsl(var(--ritual-wine))]/50 hover:shadow-[0_14px_36px_rgba(58,13,30,0.10)]'
            }`}
            style={{ transition: 'border-color 0.25s, box-shadow 0.25s' }}
          >
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[hsl(var(--ritual-blush))] flex items-center justify-center">
                <ctx.icon className="w-4 h-4 text-[hsl(var(--ritual-wine))]" />
              </div>
              <div>
                <h3 className="font-[var(--font-display)] text-base sm:text-lg text-foreground mb-1">
                  {ctx.title}
                </h3>
                <p className="text-sm text-foreground/50">{ctx.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
