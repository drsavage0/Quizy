
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Link from "next/link";
import {
  UserCircle,
  Mail,
  Star,
  Award,
  Leaf,
  Sprout,
  BrainCircuit,
  Lightbulb,
  Glasses,
  Diamond,
  BookOpen,
  Eye,
  ScrollText,
  Sparkles,
  Crown,
  Gem,
  ShieldAlert,
  LogIn,
  type LucideIcon,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import React, { useState } from "react";

interface RankInfo {
  nameKey: TranslationKey;
  icon: LucideIcon;
  colorClass: string;
  nextThreshold?: number; // Points needed to enter the *next* rank
  minPoints: number; // Points needed to enter *this* rank
}

const rankTiers: Omit<RankInfo, 'nextThreshold'>[] = [
  { nameKey: 'rankSeed', icon: Leaf, colorClass: 'bg-green-500 text-green-50', minPoints: 0 },
  { nameKey: 'rankSprout', icon: Sprout, colorClass: 'bg-lime-500 text-lime-50', minPoints: 26 },
  { nameKey: 'rankBuddingBrain', icon: BrainCircuit, colorClass: 'bg-yellow-500 text-yellow-50', minPoints: 76 },
  { nameKey: 'rankKeenThinker', icon: Glasses, colorClass: 'bg-amber-500 text-amber-50', minPoints: 151 },
  { nameKey: 'rankSharpMind', icon: Diamond, colorClass: 'bg-orange-500 text-orange-50', minPoints: 251 },
  { nameKey: 'rankKnowledgeable', icon: BookOpen, colorClass: 'bg-sky-500 text-sky-50', minPoints: 401 },
  { nameKey: 'rankInsightful', icon: Eye, colorClass: 'bg-blue-500 text-blue-50', minPoints: 601 },
  { nameKey: 'rankWise', icon: ScrollText, colorClass: 'bg-indigo-500 text-indigo-50', minPoints: 851 },
  { nameKey: 'rankSage', icon: Award, colorClass: 'bg-violet-500 text-violet-50', minPoints: 1101 },
  { nameKey: 'rankVirtuoso', icon: Sparkles, colorClass: 'bg-purple-500 text-purple-50', minPoints: 1401 },
  { nameKey: 'rankMaestro', icon: Crown, colorClass: 'bg-fuchsia-500 text-fuchsia-50', minPoints: 1751 },
  { nameKey: 'rankOracle', icon: Gem, colorClass: 'bg-pink-500 text-pink-50', minPoints: 2101 },
];

const calculateRankAndStyle = (points: number): RankInfo => {
  for (let i = rankTiers.length - 1; i >= 0; i--) {
    if (points >= rankTiers[i].minPoints) {
      const nextThreshold = i < rankTiers.length - 1 ? rankTiers[i+1].minPoints : undefined;
      return { ...rankTiers[i], nextThreshold };
    }
  }
  // Should not happen if rankTiers[0].minPoints is 0
  return { ...rankTiers[0], nextThreshold: rankTiers[1]?.minPoints };
};


export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const { t, dir } = useLanguage();
  const [isRankDialogOpn, setIsRankDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size={64} />
        <p className="text-xl text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto py-12 text-center">
        <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-4">{t('loginToViewProfile')}</h1>
        <Button asChild>
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    );
  }

  const rankInfo = calculateRankAndStyle(currentUser.totalQuizPoints || 0);
  const RankIcon = rankInfo.icon;

  const pointsToNextRank = rankInfo.nextThreshold ? rankInfo.nextThreshold - (currentUser.totalQuizPoints || 0) : 0;
  
  const currentRankStartPoints = rankInfo.minPoints;
  const pointsInCurrentRank = (currentUser.totalQuizPoints || 0) - currentRankStartPoints;
  const pointsForNextRankTier = rankInfo.nextThreshold ? rankInfo.nextThreshold - currentRankStartPoints : pointsInCurrentRank > 0 ? pointsInCurrentRank : 1; // Avoid division by zero
  
  const progressPercentage = rankInfo.nextThreshold && pointsForNextRankTier > 0 ?
    Math.max(0, Math.min(100, (pointsInCurrentRank / pointsForNextRankTier) * 100))
    : 100;


  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6 text-center border-b">
          <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-primary shadow-lg">
            <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User Avatar"} data-ai-hint="user avatar" />
            <AvatarFallback className="text-4xl">
              {currentUser.isAnonymous ? (
                <UserCircle size={60} />
              ) : currentUser.displayName ? (
                currentUser.displayName.charAt(0).toUpperCase()
              ) : (
                <UserCircle size={60} />
              )}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-primary">
            {currentUser.displayName || t('anonymousUser')}
          </CardTitle>
          {currentUser.email && !currentUser.isAnonymous && (
            <CardDescription className="text-lg text-muted-foreground flex items-center justify-center gap-2">
              <Mail className="h-5 w-5" /> {currentUser.email}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-1">{t('totalPoints')}</h3>
            <p className="text-5xl font-bold text-accent animate-pulse">{currentUser.totalQuizPoints || 0}</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('currentRank')}</h3>
            <Dialog open={isRankDialogOpn} onOpenChange={setIsRankDialogOpen}>
              <DialogTrigger asChild>
                <Badge className={cn("px-6 py-2 text-xl font-bold shadow-md transform hover:scale-105 transition-transform cursor-pointer", rankInfo.colorClass)}>
                  <RankIcon className="me-3 h-7 w-7" />
                  {t(rankInfo.nameKey)}
                </Badge>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center mb-4">{t('yourRankJourney')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-3 items-center">
                  <div className={cn("w-full flex items-end", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                    {rankTiers.map((tier, index) => {
                      const isCurrentRank = tier.nameKey === rankInfo.nameKey;
                      const isCompletedRank = (currentUser.totalQuizPoints || 0) >= (rankTiers[index + 1]?.minPoints || Infinity);
                      const IconComponent = tier.icon;

                      let tierProgress = 0;
                      if (isCompletedRank) {
                        tierProgress = 100;
                      } else if (isCurrentRank) {
                        const pointsInThisTier = (currentUser.totalQuizPoints || 0) - tier.minPoints;
                        const pointsNeededForThisTier = (rankTiers[index+1]?.minPoints || (tier.minPoints +1)) - tier.minPoints;
                        tierProgress = pointsNeededForThisTier > 0 ? Math.min(100, (pointsInThisTier / pointsNeededForThisTier) * 100) : 100;
                      }
                      
                      return (
                        <div key={tier.nameKey} className={cn("flex-1 flex flex-col items-center relative px-1 min-w-[60px]", dir === 'rtl' ? 'border-r-2' : 'border-l-2', index === 0 && (dir === 'rtl' ? 'border-r-0' : 'border-l-0'), tier.colorClass.replace('text-green-50','border-green-600/50').replace('text-lime-50','border-lime-600/50').replace('text-yellow-50','border-yellow-600/50').replace('text-amber-50','border-amber-600/50').replace('text-orange-50','border-orange-600/50').replace('text-sky-50','border-sky-600/50').replace('text-blue-50','border-blue-600/50').replace('text-indigo-50','border-indigo-600/50').replace('text-violet-50','border-violet-600/50').replace('text-purple-50','border-purple-600/50').replace('text-fuchsia-50','border-fuchsia-600/50').replace('text-pink-50','border-pink-600/50') )}>
                          <div className={cn("p-2 rounded-full mb-1", tier.colorClass, isCurrentRank && "ring-2 ring-offset-2 ring-primary ring-offset-background")}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-xs font-medium text-center break-words leading-tight">{t(tier.nameKey)}</p>
                          <p className="text-[10px] text-muted-foreground">{tier.minPoints}+</p>
                           <div className="w-full h-2 bg-muted rounded-full mt-1 overflow-hidden">
                            <div className={cn("h-full rounded-full", tier.colorClass.replace('text-','bg-'))} style={{ width: `${tierProgress}%` }} />
                          </div>
                          {isCurrentRank && (
                            <div className="absolute -bottom-5 text-xs font-semibold text-primary flex items-center animate-bounce">
                                {dir === 'rtl' ? <ChevronRight className="h-4 w-4"/> : null }
                                <TrendingUp className="h-3 w-3 mx-0.5" /> 
                                {t('youAreHere')}
                                {dir === 'ltr' ? <ChevronRight className="h-4 w-4"/> : null }
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {rankInfo.nextThreshold && (
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden relative shadow-inner">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500 ease-out", rankInfo.colorClass.replace('text-', 'bg-'))}
                  style={{ width: `${progressPercentage}%` }}
                />
                 <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground mix-blend-difference opacity-80">
                    {Math.floor(progressPercentage)}%
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {t('pointsToNextRank', { points: pointsToNextRank, rank: t(calculateRankAndStyle(rankInfo.nextThreshold).nameKey) })}
              </p>
            </div>
          )}

        </CardContent>
        <CardFooter className="bg-muted/30 p-6 border-t">
          <Button asChild className="w-full" size="lg">
            <Link href="/">{t('home')}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


    