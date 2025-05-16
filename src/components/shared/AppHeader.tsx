
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuthButtons from "@/components/auth/AuthButtons";
import { Home, Trophy, BotMessageSquare, Play, Pause, Music2, Volume2, VolumeX, Languages, Check } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useSoundEffects } from "@/contexts/SoundEffectsContext";
import { useLanguage, type Language as LanguageCode } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { isPlaying, togglePlayPause, isMusicMuted, toggleMusicMute, isInitialized: isMusicInitialized } = useAudioPlayer();
  const { areSoundEffectsMuted, toggleSoundEffectsMute } = useSoundEffects(); // Keep areSoundEffectsMuted for other potential uses if any, or remove if truly unused elsewhere
  const { language, setLanguage, t, availableLanguages } = useLanguage();

  const handleToggleGlobalMute = () => {
    toggleMusicMute();
    toggleSoundEffectsMute();
  };

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:text-accent transition-colors">
          <BotMessageSquare className="h-7 w-7" />
          {t('quizWiz')}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{t('home')}</span>
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/leaderboard" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">{t('leaderboard')}</span>
            </Link>
          </Button>
          
          {isMusicInitialized ? (
            <>
              <Button variant="ghost" size="icon" onClick={togglePlayPause} aria-label={isPlaying ? t('pauseMusic') : t('playMusic')} className="w-9 h-9 sm:w-10 sm:h-10">
                {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleToggleGlobalMute} aria-label={isMusicMuted ? t('unmuteAllAudio') : t('muteAllAudio')} className="w-9 h-9 sm:w-10 sm:h-10">
                {isMusicMuted ? <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" /> : <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
            </>
          ) : (
             <Button variant="ghost" size="icon" disabled aria-label={t('loading')} className="w-9 h-9 sm:w-10 sm:h-10">
              <Music2 className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </Button>
          )}

          {/* Sound effects Bell button removed */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={t('language')} className="w-9 h-9 sm:w-10 sm:h-10">
                <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">{t('selectLanguage')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('selectLanguage')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as LanguageCode)}
                  className="flex items-center justify-between"
                >
                  {lang.nativeName}
                  {language === lang.code && <Check className="ms-2 h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <AuthButtons />
        </nav>
      </div>
    </header>
  );
}
