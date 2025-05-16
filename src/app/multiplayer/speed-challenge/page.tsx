
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from "@/contexts/LanguageContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// This page redirects users to the new Speed Challenge lobby.
export default function OldSpeedChallengeRedirectPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    router.replace('/multiplayer/speed-challenge/lobby');
  }, [router]);

  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
      <LoadingSpinner size={32} />
      <p className="text-muted-foreground">{t('loading')}</p>
    </div>
  );
}
