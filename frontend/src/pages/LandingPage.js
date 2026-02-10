import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Heart, Lock, Feather } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' }
  })
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [pricing, setPricing] = useState({ display: '$6.99', symbol: '$', price: 6.99, currency: 'USD' });

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/pricing`);
        setPricing(res.data);
      } catch (err) {
        // Fallback to default
      }
    };
    fetchPricing();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      {/* Urgency Banner */}
      <div
        data-testid="valentine-urgency-banner"
        className="w-full py-2.5 px-4 text-center bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))]"
      >
        <p className="text-sm font-medium tracking-wide">
          Valentine's Edition — Some things shouldn't wait another year
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle warm glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(1200px 500px at 20% 0%, rgba(215,168,91,0.14), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(231,185,195,0.16), transparent 55%)'
        }} />

        <div className="relative max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-[var(--font-display)] text-4xl sm:text-5xl lg:text-[3.5rem] tracking-[-0.02em] text-foreground leading-[1.1] mb-6"
            >
              Some feelings are too real to text.
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-[var(--font-ui)] text-base sm:text-lg text-foreground/70 leading-relaxed mb-10 max-w-lg mx-auto"
            >
              Write the letter you've been holding inside.
            </motion.p>

            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <Button
                data-testid="landing-begin-ritual-button"
                onClick={() => navigate('/flow/context')}
                className="h-12 px-8 text-[15px] rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none"
                style={{ transition: 'color 0.2s, background-color 0.2s, box-shadow 0.2s, transform 0.15s' }}
              >
                <Feather className="w-4 h-4 mr-2" />
                Write a Valentine Letter
              </Button>
            </motion.div>

            <motion.p
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-6 text-sm text-foreground/50"
            >
              Written once. Private. Never stored.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Emotional manifesto — dark wine section */}
      <section className="relative bg-[hsl(var(--ritual-wine-deep))] py-20 sm:py-28 lg:py-36 overflow-hidden">
        <div className="max-w-[480px] mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-[var(--font-letter)] italic text-lg sm:text-xl lg:text-2xl text-[hsl(var(--primary-foreground))]/70 leading-relaxed"
          >
            For the words that keep you up at night.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 0.3, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-6 h-px bg-[hsl(var(--primary-foreground))] mx-auto my-10 sm:my-14"
          />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-[var(--font-letter)] italic text-lg sm:text-xl lg:text-2xl text-[hsl(var(--primary-foreground))]/70 leading-relaxed"
          >
            For the things you rehearse but never say.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 0.3, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="w-6 h-px bg-[hsl(var(--primary-foreground))] mx-auto my-10 sm:my-14"
          />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="font-[var(--font-letter)] italic text-lg sm:text-xl lg:text-2xl text-[hsl(var(--primary-foreground))]/70 leading-relaxed"
          >
            For the love that deserves more than a text.
          </motion.p>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 sm:py-20">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-[var(--font-display)] text-2xl sm:text-3xl text-center mb-12 text-foreground"
          >
            A quiet ritual, in four steps
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: 'Choose your story', desc: 'Tell us who this letter is for — a distant love, someone lost, or words left unsaid.' },
              { icon: Feather, title: 'Share what\'s true', desc: 'Answer a few gentle questions. Memories, feelings, the things you never say.' },
              { icon: Lock, title: 'Pick how it arrives', desc: 'A sealed envelope, a timed reveal, or an unsent letter that fades after reading.' },
              { icon: Heart, title: 'Receive your letter', desc: 'A handwritten-style letter, crafted from your words. Private and ephemeral.' }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="relative overflow-hidden rounded-xl bg-card p-6 paper-noise border border-[hsl(var(--border))] shadow-[0_12px_30px_rgba(58,13,30,0.06)]"
              >
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--ritual-blush))] flex items-center justify-center mb-4">
                    <step.icon className="w-4 h-4 text-[hsl(var(--ritual-wine))]" />
                  </div>
                  <h3 className="font-[var(--font-display)] text-lg mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy + Price Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[540px] mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Lock className="w-5 h-5 mx-auto mb-4 text-foreground/40" />
            <h3 className="font-[var(--font-display)] text-xl sm:text-2xl mb-3 text-foreground">Private by design</h3>
            <p className="text-sm text-foreground/60 leading-relaxed mb-6">
              Your letter is encrypted, never stored permanently, and auto-deleted based on the delivery format you choose. No accounts. No tracking.
            </p>
            <div className="inline-flex items-baseline gap-1 mb-6">
              <span className="font-[var(--font-display)] text-3xl text-foreground">{pricing.display}</span>
              <span className="text-sm text-foreground/50">one letter</span>
            </div>
            <div>
              <Button
                data-testid="landing-cta-bottom"
                onClick={() => navigate('/flow/context')}
                className="h-11 px-6 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))]"
              >
                Begin writing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[hsl(var(--border))]">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-foreground/40">
            Letters You Can't Send — Valentine Edition
          </p>
          <p className="text-xs text-foreground/30 mt-1">
            Written once, for one person.
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
