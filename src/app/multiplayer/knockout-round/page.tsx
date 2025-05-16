
"use client";

import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function KnockoutRoundPage() {
  const { t, dir } = useLanguage();

  return (
    <div className="container mx-auto py-12 flex flex-col items-center text-center space-y-8">
      <header className="mb-6">
        <ShieldOff className="w-20 h-20 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">{t('knockoutRoundTitle')}</h1>
        <p className="text-xl text-muted-foreground mt-2">{t('knockoutRoundDescription')}</p>
      </header>

      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-xl">
        <Users className="w-16 h-16 text-accent mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">{t('comingSoon')}!</h2>
        <p className="text-muted-foreground mb-6">
          {/* You can add a more detailed explanation of the mode here if you like */}
          This exciting 8-player battle royale mode is currently under development. Stay tuned for updates!
        </p>
        {/* Placeholder for future lobby/game start UI */}
      </div>

      <Button variant="outline" asChild size="lg">
        <Link href="/multiplayer">
          <ArrowLeft className={cn("h-5 w-5", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
          {t('backToModes')}
        </Link>
      </Button>
    </div>
  );
}
