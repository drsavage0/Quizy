
"use client";

import type { ReactNode } from "react";
import React, { createContext, useState, useContext, useCallback } from "react";

interface SoundEffectsContextType {
  areSoundEffectsMuted: boolean;
  toggleSoundEffectsMute: () => void;
  playSoundEffect: (soundUrl: string) => void;
  soundEffectsVolume: number;
  setSoundEffectsVolume: (volume: number) => void;
}

const SoundEffectsContext = createContext<SoundEffectsContextType | undefined>(undefined);

export const SoundEffectsProvider = ({ children }: { children: ReactNode }) => {
  const [areSoundEffectsMuted, setAreSoundEffectsMuted] = useState(false);
  const [soundEffectsVolume, setSoundEffectsVolumeState] = useState(1); // Default volume: 100%

  const toggleSoundEffectsMute = useCallback(() => {
    setAreSoundEffectsMuted((prevMuted) => !prevMuted);
  }, []);

  const playSoundEffect = useCallback((soundUrl: string) => {
    if (!areSoundEffectsMuted && typeof window !== "undefined") {
      const audio = new Audio(soundUrl);
      audio.volume = soundEffectsVolume; // Apply current SFX volume
      audio.play().catch(e => console.error("Error playing sound effect:", e));
    }
  }, [areSoundEffectsMuted, soundEffectsVolume]);

  const setSoundEffectsVolume = useCallback((volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    setSoundEffectsVolumeState(newVolume);
  }, []);

  return (
    <SoundEffectsContext.Provider value={{ areSoundEffectsMuted, toggleSoundEffectsMute, playSoundEffect, soundEffectsVolume, setSoundEffectsVolume }}>
      {children}
    </SoundEffectsContext.Provider>
  );
};

export const useSoundEffects = (): SoundEffectsContextType => {
  const context = useContext(SoundEffectsContext);
  if (context === undefined) {
    throw new Error("useSoundEffects must be used within a SoundEffectsProvider");
  }
  return context;
};
