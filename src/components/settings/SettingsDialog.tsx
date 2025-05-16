
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useSoundEffects } from "@/contexts/SoundEffectsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { t } = useLanguage();
  const { musicVolume, setMusicVolume, isMusicMuted } = useAudioPlayer();
  const { soundEffectsVolume, setSoundEffectsVolume, areSoundEffectsMuted } = useSoundEffects();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card shadow-xl rounded-lg">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold text-primary">{t('settingsTitle')}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">{t('settingsDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-8 py-6">
          <div className="space-y-3">
            <Label htmlFor="music-volume" className="text-base font-medium text-foreground">
              {t('musicVolumeLabel')} ({Math.round(musicVolume * 100)}%)
            </Label>
            <Slider
              id="music-volume"
              min={0}
              max={1}
              step={0.01}
              value={[musicVolume]}
              onValueChange={(value) => setMusicVolume(value[0])}
              disabled={isMusicMuted}
              className={cn("w-full h-2 rounded-full", isMusicMuted && "opacity-50 cursor-not-allowed")}
              aria-label={t('musicVolumeLabel')}
            />
            {isMusicMuted && (
              <p className="text-xs text-muted-foreground italic">{t('musicMutedInfo')}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label htmlFor="sfx-volume" className="text-base font-medium text-foreground">
              {t('soundEffectsVolumeLabel')} ({Math.round(soundEffectsVolume * 100)}%)
            </Label>
            <Slider
              id="sfx-volume"
              min={0}
              max={1}
              step={0.01}
              value={[soundEffectsVolume]}
              onValueChange={(value) => setSoundEffectsVolume(value[0])}
              disabled={areSoundEffectsMuted}
              className={cn("w-full h-2 rounded-full", areSoundEffectsMuted && "opacity-50 cursor-not-allowed")}
              aria-label={t('soundEffectsVolumeLabel')}
            />
            {areSoundEffectsMuted && (
              <p className="text-xs text-muted-foreground italic">{t('soundEffectsMutedInfo')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
