
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PlusCircle, Users, ArrowLeft, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

const QUICK_MATCH_SPEED_GAME_ID = "global-quick-speed-challenge"; // Predefined ID for speed quick matches

export default function SpeedChallengeLobbyPage() {
  const router = useRouter();
  const { t, dir } = useLanguage();
  const [gameIdToJoin, setGameIdToJoin] = useState("");

  const handleCreateGame = () => {
    const newGameId = uuidv4().substring(0, 8); // Generate a short unique ID
    router.push(`/multiplayer/speed-challenge/${newGameId}`);
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameIdToJoin.trim()) {
      router.push(`/multiplayer/speed-challenge/${gameIdToJoin.trim()}`);
    }
  };

  const handleQuickMatch = () => {
    router.push(`/multiplayer/speed-challenge/${QUICK_MATCH_SPEED_GAME_ID}`);
  };

  const ArrowBackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="container mx-auto py-8 flex flex-col items-center space-y-10">
      <header className="text-center">
        <Zap className="w-16 h-16 text-primary mx-auto mb-3" />
        <h1 className="text-4xl font-bold tracking-tight text-primary">{t('speedChallengeLobbyTitle')}</h1>
        <p className="text-xl text-muted-foreground mt-2">{t('speedChallengeLobbySubtitle')}</p>
      </header>

      <div className="w-full max-w-md space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Zap className="text-primary" />
              {t('quickMatchTitle')}
            </CardTitle>
            <CardDescription>{t('quickMatchDescription')}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleQuickMatch} className="w-full" size="lg">
              {t('findOpponentButton')} <ArrowRight className="ms-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <PlusCircle className="text-primary" />
              {t('createNewGame')}
            </CardTitle>
            <CardDescription>{t('createNewSpeedChallengeDescription')}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleCreateGame} className="w-full" variant="secondary" size="lg">
              {t('createGameButton')} <ArrowRight className="ms-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ArrowRight className="text-primary" />
              {t('joinExistingGame')}
            </CardTitle>
            <CardDescription>{t('joinExistingSpeedChallengeDescription')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleJoinGame}>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="gameId" className="text-base">{t('enterGameIdLabel')}</Label>
                <Input
                  id="gameId"
                  value={gameIdToJoin}
                  onChange={(e) => setGameIdToJoin(e.target.value)}
                  placeholder={t('gameIdPlaceholder')}
                  className="mt-1"
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" variant="secondary" size="lg" disabled={!gameIdToJoin.trim()}>
                {t('joinGameButton')} <ArrowRight className="ms-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="mt-8">
        <Button variant="outline" onClick={() => router.push('/multiplayer')} size="lg">
          <ArrowBackIcon className={cn("h-5 w-5", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
          {t('backToModes')}
        </Button>
      </div>
    </div>
  );
}
