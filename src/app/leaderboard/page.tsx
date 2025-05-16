
"use client";

import LeaderboardDisplay from "@/components/leaderboard/LeaderboardDisplay";
import { Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LeaderboardPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto py-8">
      <header className="text-center mb-10">
        <Trophy className="w-16 h-16 text-primary mx-auto mb-3" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">{t('globalLeaderboard')}</h1>
        <p className="text-xl text-muted-foreground mt-2">{t('leaderboardGlobalSubtitle')}</p>
      </header>
      <LeaderboardDisplay />
    </div>
  );
}
