
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from "@/contexts/LanguageContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// This page is deprecated and users should be redirected to the lobby.
export default function OldScoreAttackRedirectPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    router.replace('/multiplayer/lobby');
  }, [router]);

  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
      <LoadingSpinner size={32} />
      <p className="text-muted-foreground">{t('loading') /* Using a generic 'loading' key */}</p>
    </div>
  );
}
