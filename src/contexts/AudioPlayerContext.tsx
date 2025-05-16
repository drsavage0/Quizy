
"use client";

import type { ReactNode } from "react";
import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";

interface AudioPlayerContextType {
  isPlaying: boolean; // User's intent to play music
  togglePlayPause: () => void;
  isMusicMuted: boolean;
  toggleMusicMute: () => void;
  isInitialized: boolean;
  musicVolume: number;
  setMusicVolume: (volume: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

const MUSIC_URLS = [
  "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/music%20folder%2FNoMBe%20-%20Take%20Me%20Down%20To%20The%20Fashion%20Show.mp3?alt=media&token=e833abf3-ff8c-4fff-8b1f-4e3a9b6a503e",
  "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/music%20folder%2FTwin%20Musicom%20-%20Midnight%20in%20the%20Graveyard.mp3?alt=media&token=44bfe250-219c-4542-b15e-82ce60a2f131"
];

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(true); 
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(1); // Default volume: 100%
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentMusicUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!currentMusicUrlRef.current) {
        currentMusicUrlRef.current = MUSIC_URLS[Math.floor(Math.random() * MUSIC_URLS.length)];
      }
      const musicUrl = currentMusicUrlRef.current;

      if (!musicUrl || musicUrl.includes("YOUR_FIREBASE_STORAGE_PUBLIC_URL")) { 
        console.warn("AudioPlayerContext: Invalid or placeholder music URL selected.");
        setIsInitialized(false);
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(musicUrl);
      } else if (audioRef.current.src !== musicUrl) {
          if(!audioRef.current.paused) audioRef.current.pause();
          audioRef.current.src = musicUrl;
      }
      
      audioRef.current.loop = true;
      audioRef.current.preload = "auto";
      audioRef.current.volume = musicVolume; // Set initial volume
      const audio = audioRef.current;

      const handleCanPlayThrough = () => {
        setIsInitialized(true);
        if (isPlaying && !isMusicMuted && audioRef.current) {
           audioRef.current.play().catch(error => {
            console.warn("Audio autoplay was prevented:", error);
            setIsPlaying(false); 
          });
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
      };
      
      const audioInstance = audioRef.current; 
      audioInstance.removeEventListener('canplaythrough', handleCanPlayThrough); 
      audioInstance.addEventListener('canplaythrough', handleCanPlayThrough);
      
      if (audioInstance.src && audioInstance.readyState < 3) { // readyState < HAVE_FUTURE_DATA
        audioInstance.load(); 
      } else if (audioInstance.readyState >= 3 && isPlaying && !isMusicMuted) {
        // If already playable and intended to play, try playing
        audioInstance.play().catch(e => {
          console.warn("Error trying to play already loaded audio:", e);
          setIsPlaying(false);
        });
      }


      return () => {
        if (audioInstance) {
            audioInstance.removeEventListener('canplaythrough', handleCanPlayThrough);
            if(!audioInstance.paused) audioInstance.pause();
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 

  useEffect(() => {
    if (audioRef.current && isInitialized) {
      if (isPlaying && !isMusicMuted) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(e => {
            console.warn("Error playing music:", e);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, isMusicMuted, isInitialized]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);


  const togglePlayPause = useCallback(() => {
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  }, []);

  const toggleMusicMute = useCallback(() => {
    setIsMusicMuted((prevMuted) => !prevMuted);
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    setMusicVolumeState(newVolume);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ isPlaying, togglePlayPause, isMusicMuted, toggleMusicMute, isInitialized, musicVolume, setMusicVolume }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
};
