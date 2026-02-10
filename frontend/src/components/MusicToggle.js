import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

// Multiple fallback audio sources for reliability
const AUDIO_SOURCES = [
  'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
  'https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f9.mp3',
];

export default function MusicToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const audioSourceIndex = useRef(0);

  const TARGET_VOLUME = 0.12;

  const initAudio = useCallback(() => {
    if (audioRef.current) return;

    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0;
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';

    const trySource = (index) => {
      if (index >= AUDIO_SOURCES.length) {
        console.warn('All audio sources failed');
        return;
      }
      audio.src = AUDIO_SOURCES[index];
      audio.load();
    };

    audio.addEventListener('canplaythrough', () => {
      setAudioReady(true);
    });

    audio.addEventListener('error', () => {
      console.warn(`Audio source ${audioSourceIndex.current} failed, trying next...`);
      audioSourceIndex.current += 1;
      trySource(audioSourceIndex.current);
    });

    audioRef.current = audio;
    trySource(0);
  }, []);

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const fadeVolume = (audio, targetVol, onComplete) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    
    const step = targetVol > audio.volume ? 0.008 : -0.008;
    fadeIntervalRef.current = setInterval(() => {
      const newVol = audio.volume + step;
      if ((step > 0 && newVol >= targetVol) || (step < 0 && newVol <= targetVol)) {
        audio.volume = Math.max(0, Math.min(1, targetVol));
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (onComplete) onComplete();
      } else {
        audio.volume = Math.max(0, Math.min(1, newVol));
      }
    }, 40);
  };

  const toggle = async () => {
    // Initialize audio on first user interaction
    if (!audioRef.current) {
      initAudio();
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // Fade out
      fadeVolume(audio, 0, () => {
        audio.pause();
      });
      setIsPlaying(false);
    } else {
      // Load source if not loaded
      if (!audio.src || audio.src === '') {
        audio.src = AUDIO_SOURCES[0];
        audio.load();
      }

      audio.volume = 0;
      try {
        await audio.play();
        fadeVolume(audio, TARGET_VOLUME);
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio play failed:', err);
        // Try next source
        audioSourceIndex.current += 1;
        if (audioSourceIndex.current < AUDIO_SOURCES.length) {
          audio.src = AUDIO_SOURCES[audioSourceIndex.current];
          audio.load();
          try {
            await audio.play();
            fadeVolume(audio, TARGET_VOLUME);
            setIsPlaying(true);
          } catch (err2) {
            console.error('All audio attempts failed:', err2);
          }
        }
      }
    }
  };

  return (
    <motion.button
      data-testid="music-toggle-switch"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      onClick={toggle}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 h-9 px-3 rounded-full bg-card/80 backdrop-blur-sm border border-[hsl(var(--border))] shadow-[0_4px_12px_rgba(58,13,30,0.06)] hover:shadow-[0_6px_16px_rgba(58,13,30,0.1)]"
      style={{ transition: 'box-shadow 0.2s' }}
      aria-label={isPlaying ? 'Turn music off' : 'Turn music on'}
    >
      {isPlaying ? (
        <Volume2 className="w-3.5 h-3.5 text-foreground/60" />
      ) : (
        <VolumeX className="w-3.5 h-3.5 text-foreground/40" />
      )}
      <span className="text-xs text-foreground/50">
        {isPlaying ? 'Music on' : 'Music'}
      </span>
    </motion.button>
  );
}
