
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Zap, Target, BookOpen, ShieldOff, Users, ArrowRight, ArrowLeft } from "lucide-react";
import type { MultiplayerMode } from "@/types";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const multiplayerModes: MultiplayerMode[] = [
  {
    id: "speed-challenge",
    translationKey: "speedChallengeTitle",
    descriptionKey: "speedChallengeDescription",
    icon: Zap,
    path: "/multiplayer/speed-challenge/lobby", // Updated path
  },
  {
    id: "score-attack",
    translationKey: "scoreAttackTitle",
    descriptionKey: "scoreAttackDescription",
    icon: Target,
    path: "/multiplayer/lobby", 
  },
  {
    id: "topic-duel",
    translationKey: "topicDuelTitle",
    descriptionKey: "topicDuelDescription",
    icon: BookOpen,
    path: "/multiplayer/topic-duel", 
  },
  {
    id: "knockout-round",
    translationKey: "knockoutRoundTitle",
    descriptionKey: "knockoutRoundDescription",
    icon: ShieldOff,
    path: "/multiplayer/knockout-round", 
  },
];

export default function MultiplayerPage() {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // Define which modes are currently enabled for navigation
  const enabledModes = ['score-attack', 'knockout-round', 'speed-challenge'];

  return (
    <div className="container mx-auto py-8">
      <header className="text-center mb-10">
        <Users className="w-16 h-16 text-primary mx-auto mb-3" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">{t('multiplayerPageTitle')}</h1>
        <p className="text-xl text-muted-foreground mt-2">{t('multiplayerPageSubtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {multiplayerModes.map((mode) => {
          const isEnabled = enabledModes.includes(mode.id);
          return (
            <Card
              key={mode.id}
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 focus-within:scale-105 focus-within:shadow-2xl group bg-card"
              data-ai-hint={`${mode.id.replace('-', ' ')} game mode`}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-3">
                <mode.icon className="w-10 h-10 text-primary group-hover:text-accent transition-colors" />
                <CardTitle className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {t(mode.translationKey)}
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[60px]">
                <CardDescription className="text-muted-foreground">
                  {t(mode.descriptionKey)}
                </CardDescription>
              </CardContent>
              <CardFooter className="mt-auto">
                <Link href={mode.path} passHref className="w-full">
                  <Button 
                    variant="default" 
                    className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                    disabled={!isEnabled}
                  > 
                    {t('selectModeButton')} <ArrowIcon className="ms-2 h-4 w-4" />
                    {!isEnabled && <span className="ms-2 text-xs opacity-70">({t('comingSoon')})</span>}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
       <div className="mt-12 text-center">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
              {t('home')}
            </Link>
          </Button>
        </div>
    </div>
  );
}
