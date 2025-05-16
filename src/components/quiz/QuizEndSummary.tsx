
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Trophy, RotateCcw, Home, List, UserCheck, LogInIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { firestoreService } from "@/services/firestoreService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Difficulty } from "@/types";

interface QuizEndSummaryProps {
  score: number;
  totalQuestions: number;
  topic: string;
  difficulty: Difficulty; // Added difficulty
}

export default function QuizEndSummary({ score, totalQuestions, topic, difficulty }: QuizEndSummaryProps) {
  const router = useRouter();
  const { currentUser, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const handleSaveScore = async () => {
    if (!currentUser) { 
      toast({
        title: t('loginRequiredToSave'),
        description: t('loginToSaveDescription'),
        variant: "default",
      });
      return;
    }

    let displayNameForScore = currentUser.displayName;
    if (currentUser.isAnonymous) {
      displayNameForScore = t('guest'); 
    } else if (!currentUser.displayName) {
      toast({
        title: t('profileIncomplete'),
        description: t('profileIncompleteDescription'),
        variant: "default",
      });
      return; 
    }

    try {
      const savedScoreId = await firestoreService.saveScore({
        userId: currentUser.uid,
        displayName: displayNameForScore,
        photoURL: currentUser.photoURL, 
        score,
        totalQuestions,
        topic: `${topic} (${difficulty})`, // Include difficulty in the topic string for leaderboard
      });

      if (savedScoreId) {
        toast({
          title: t('scoreSaved'),
          description: t('scoreSavedDescription'),
        });
      } else {
        throw new Error(t('failedToSaveScoreError'));
      }
    } catch (error) {
      toast({
        title: t('errorSavingScore'),
        description: (error as Error).message || t('couldNotSaveScoreError'),
        variant: "destructive",
      });
    }
  };

  const promptLogin = () => {
    toast({
      title: t('loginToSaveTitle'),
      description: t('loginToSaveDescriptionFull'),
      action: (
        <Button onClick={async () => {
          await signInWithGoogle(); 
          toast({ title: t('loginSuccessful'), description: t('trySavingScoreAgain') });
        }} size="sm">
          <LogInIcon className="me-2 h-4 w-4" />
          {t('loginWithGoogle')}
        </Button>
      ),
    });
  };


  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader className="text-center">
        <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
        <CardTitle className="text-3xl">{t('quizCompleteTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-xl text-muted-foreground">
          {t('youPlayedTopic', { topic: `${topic} (${t(`difficulty${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}` as TranslationKey)})` })}
        </p>
        <p className="text-4xl font-bold">
          {t('score')}: {score} / {totalQuestions}
        </p>
        <p className="text-2xl text-accent-foreground">({percentage}%)</p>
        
        {currentUser && (
          <Button onClick={handleSaveScore} className="mt-4">
            <UserCheck className="me-2 h-4 w-4" /> {t('saveToLeaderboard')}
          </Button>
        )}
         {!currentUser && (
          <div className="mt-4 space-y-2">
            <Button onClick={promptLogin} className="w-full">
              <LogInIcon className="me-2 h-4 w-4" /> {t('loginToSaveScore')}
            </Button>
            <p className="text-xs text-muted-foreground px-4">
              {t('loginToSaveInfo')}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
        {/* Pass difficulty back when playing again */}
        <Button onClick={() => router.push(`/quiz/${encodeURIComponent(topic)}?difficulty=${difficulty}`)} variant="outline" className="w-full sm:w-auto">
          <RotateCcw className="me-2 h-4 w-4" /> {t('playAgain')}
        </Button>
        <Button onClick={() => router.push("/")} className="w-full sm:w-auto">
          <Home className="me-2 h-4 w-4" /> {t('newCategory')}
        </Button>
        <Button onClick={() => router.push("/leaderboard")} variant="secondary" className="w-full sm:w-auto">
          <List className="me-2 h-4 w-4" /> {t('leaderboard')}
        </Button>
      </CardFooter>
    </Card>
  );
}
