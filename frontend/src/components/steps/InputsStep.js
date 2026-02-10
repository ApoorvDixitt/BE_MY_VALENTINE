import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '../../App';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

const tones = [
  { id: 'gentle-romantic', label: 'Gentle & romantic', desc: 'Warm, tender, soft-spoken' },
  { id: 'deep-emotional', label: 'Deep & emotional', desc: 'Heavy, truthful, from the center' },
  { id: 'poetic-dreamy', label: 'Poetic & dreamy', desc: 'Imagery, rhythm, like a half-remembered dream' },
  { id: 'honest-raw', label: 'Honest & raw', desc: 'Direct, unpolished, real' },
];

const languages = [
  { id: 'english', label: 'English', desc: '"The night feels stitched together with hours that belong to you…"' },
  { id: 'hindi', label: 'Hindi', desc: '"उस शाम तेरे माथे पर जब हलका सा हाथ रखा था…"' },
  { id: 'hinglish', label: 'Hinglish', desc: '"Aaj raat ko khidki ke paas baitha tha, tumhara chehra le kar…"' },
];

export default function InputsStep() {
  const navigate = useNavigate();
  const { flowData, updateFlow } = useFlow();

  const [name, setName] = useState(flowData.name || '');
  const [feelings, setFeelings] = useState(flowData.feelings || '');
  const [missing, setMissing] = useState(flowData.missing || '');
  const [memory, setMemory] = useState(flowData.memory || '');
  const [unsaid, setUnsaid] = useState(flowData.unsaid || '');
  const [tone, setTone] = useState(flowData.tone || 'gentle-romantic');
  const [language, setLanguage] = useState(flowData.language || 'english');

  const handleNext = () => {
    updateFlow({ name, feelings, missing, memory, unsaid, tone, language });
    navigate('/flow/delivery');
  };

  return (
    <div>
      <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl text-foreground mb-2">
        Tell us what's true.
      </h2>
      <p className="text-sm text-foreground/60 mb-8">
        Answer what feels right. Everything is optional.
      </p>

      <div className="space-y-6">
        {/* Language Selection (required) */}
        <div className="space-y-3">
          <Label className="font-[var(--font-ui)] text-sm text-foreground/80">
            Language of your letter
          </Label>
          <p className="text-xs text-foreground/50">Choose how your letter will be written.</p>

          <RadioGroup
            value={language}
            onValueChange={setLanguage}
            className="space-y-2"
          >
            {languages.map((l) => (
              <label
                key={l.id}
                data-testid={`language-option-${l.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                  language === l.id
                    ? 'border-[hsl(var(--ritual-wine))] bg-[hsl(var(--ritual-blush))]/30'
                    : 'border-[hsl(var(--border))] bg-card hover:border-[hsl(var(--ritual-wine))]/40'
                }`}
                style={{ transition: 'border-color 0.2s, background-color 0.2s' }}
              >
                <RadioGroupItem value={l.id} />
                <div>
                  <p className="text-sm font-medium text-foreground">{l.label}</p>
                  <p className="text-xs text-foreground/50">{l.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label className="font-[var(--font-ui)] text-sm text-foreground/80">
            Their name, or how you think of them
          </Label>
          <p className="text-xs text-foreground/50">A name, a nickname, or just "you."</p>
          <Input
            data-testid="input-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Alex, Love, You"
            className="bg-[hsl(var(--ritual-parchment))] shadow-[inset_0_0_0_1px_rgba(58,13,30,0.10)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ritual-candle))]"
          />
        </div>

        {/* Feelings */}
        <div className="space-y-2">
          <Label className="font-[var(--font-ui)] text-sm text-foreground/80">
            How do they make you feel?
          </Label>
          <p className="text-xs text-foreground/50">Words, separated by commas. Let them come.</p>
          <Input
            data-testid="input-feelings"
            value={feelings}
            onChange={(e) => setFeelings(e.target.value)}
            placeholder="e.g., warm, safe, aching, hopeful"
            className="bg-[hsl(var(--ritual-parchment))] shadow-[inset_0_0_0_1px_rgba(58,13,30,0.10)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ritual-candle))]"
          />
        </div>

        {/* Missing */}
        <div className="space-y-2">
          <Label className="font-[var(--font-ui)] text-sm text-foreground/80">
            What do you miss the most right now?
          </Label>
          <p className="text-xs text-foreground/50">A gesture, a sound, a feeling — something specific.</p>
          <Textarea
            data-testid="input-missing"
            value={missing}
            onChange={(e) => setMissing(e.target.value)}
            placeholder="e.g., The way they laugh when they're half asleep"
            className="min-h-[100px] bg-[hsl(var(--ritual-parchment))] shadow-[inset_0_0_0_1px_rgba(58,13,30,0.10)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ritual-candle))]"
          />
        </div>

        {/* Memory */}
        <div className="space-y-2">
          <Label className="font-[var(--font-ui)] text-sm text-foreground/80">
            One memory that keeps returning
          </Label>
          <p className="text-xs text-foreground/50">The moment that plays on repeat.</p>
          <Textarea
            data-testid="input-memory"
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            placeholder="e.g., Dancing in the kitchen at 2am with no music"
            className="min-h-[100px] bg-[hsl(var(--ritual-parchment))] shadow-[inset_0_0_0_1px_rgba(58,13,30,0.10)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ritual-candle))]"
          />
        </div>

        {/* Unsaid */}
        <div className="space-y-2">
          <Label className="font-[var(--font-ui)] text-sm text-foreground/80">
            One thing you never say out loud
          </Label>
          <p className="text-xs text-foreground/50">The truth that stays inside.</p>
          <Textarea
            data-testid="input-unsaid"
            value={unsaid}
            onChange={(e) => setUnsaid(e.target.value)}
            placeholder="e.g., I'm afraid you'll stop waiting"
            className="min-h-[100px] bg-[hsl(var(--ritual-parchment))] shadow-[inset_0_0_0_1px_rgba(58,13,30,0.10)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ritual-candle))]"
          />
        </div>

        {/* Tone Selector */}
        <div className="space-y-3">
          <Label className="font-[var(--font-ui)] text-sm text-foreground/80">
            Choose a tone for your letter
          </Label>
          <p className="text-xs text-foreground/50">How should this letter feel?</p>

          <RadioGroup
            value={tone}
            onValueChange={setTone}
            className="space-y-2"
          >
            {tones.map((t) => (
              <label
                key={t.id}
                data-testid={`tone-option-${t.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                  tone === t.id
                    ? 'border-[hsl(var(--ritual-wine))] bg-[hsl(var(--ritual-blush))]/30'
                    : 'border-[hsl(var(--border))] bg-card hover:border-[hsl(var(--ritual-wine))]/40'
                }`}
                style={{ transition: 'border-color 0.2s, background-color 0.2s' }}
              >
                <RadioGroupItem value={t.id} />
                <div>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-foreground/50">{t.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Next button */}
        <div className="pt-4">
          <Button
            data-testid="inputs-next-button"
            onClick={handleNext}
            className="w-full h-12 rounded-xl bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))] shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))]"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
