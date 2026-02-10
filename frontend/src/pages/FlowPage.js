import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFlow } from '../App';
import ContextStep from '../components/steps/ContextStep';
import InputsStep from '../components/steps/InputsStep';
import DeliveryStep from '../components/steps/DeliveryStep';
import PaymentStep from '../components/steps/PaymentStep';

const STEPS = ['context', 'inputs', 'delivery', 'payment'];

export default function FlowPage() {
  const { step } = useParams();
  const navigate = useNavigate();
  const { flowData } = useFlow();
  const currentIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (currentIndex === -1) {
      navigate('/flow/context');
    }
  }, [currentIndex, navigate]);

  if (currentIndex === -1) return null;

  const stepLabels = ['Your story', 'What\'s true', 'How it arrives', 'Your letter'];

  const renderStep = () => {
    switch (step) {
      case 'context': return <ContextStep />;
      case 'inputs': return <InputsStep />;
      case 'delivery': return <DeliveryStep />;
      case 'payment': return <PaymentStep />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen"
    >
      {/* Progress indicator */}
      <div className="w-full py-4 px-4 sm:px-6">
        <div className="max-w-[540px] mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              data-testid="flow-back-button"
              onClick={() => {
                if (currentIndex === 0) navigate('/');
                else navigate(`/flow/${STEPS[currentIndex - 1]}`);
              }}
              className="text-sm text-foreground/50 hover:text-foreground/80"
              style={{ transition: 'color 0.2s' }}
            >
              ← Back
            </button>
            <span className="text-xs text-foreground/40 font-[var(--font-ui)]">
              Step {currentIndex + 1} of {STEPS.length} — {stepLabels[currentIndex]}
            </span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i <= currentIndex
                    ? 'bg-[hsl(var(--ritual-wine))]'
                    : 'bg-[hsl(var(--border))]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-[540px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        >
          {renderStep()}
        </motion.div>
      </div>

      {/* Privacy microcopy */}
      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-[11px] text-foreground/30">
          Nothing is stored beyond making your letter.
        </p>
      </div>
    </motion.div>
  );
}
