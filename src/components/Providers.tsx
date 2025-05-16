
"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { SoundEffectsProvider } from "@/contexts/SoundEffectsContext";
import { LanguageProvider } from "@/contexts/LanguageContext"; // Import LanguageProvider
import { Toaster } from "@/components/ui/toaster";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioPlayerProvider>
          <SoundEffectsProvider>
            <LanguageProvider> {/* Add LanguageProvider */}
              {children}
              <Toaster />
            </LanguageProvider>
          </SoundEffectsProvider>
        </AudioPlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
