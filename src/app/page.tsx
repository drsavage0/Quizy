
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category, Difficulty, UserProfile } from "@/types";
import { 
  FlaskConical, Landmark, Gamepad2, Film, Sparkles, ArrowRight, Wand2, ArrowLeft, Flame, Dribbble, Globe, Shuffle, Brain, Star, Users,
  Leaf, Sprout, BrainCircuit, Glasses, Diamond, BookOpen, Eye, ScrollText, Award, Crown, Gem, type LucideIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { suggestTopics } from "@/services/aiService";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";


const predefinedCategories: Category[] = [
  { name: "Science", icon: FlaskConical, description: "Test your knowledge of the natural world.", translationKey: "science", descriptionKey: "scienceDescription" },
  { name: "History", icon: Landmark, description: "Journey through time with historical facts.", translationKey: "history", descriptionKey: "historyDescription" },
  { name: "Gaming", icon: Gamepad2, description: "Challenge your expertise in video games.", translationKey: "gaming", descriptionKey: "gamingDescription" },
  { name: "Movies", icon: Film, description: "How well do you know the silver screen?", translationKey: "movies", descriptionKey: "moviesDescription", popular: true },
  { name: "Sports", icon: Dribbble, description: "Flex your knowledge of athletic feats and rivalries.", translationKey: "sports", descriptionKey: "sportsDescription", popular: true },
  { name: "Geography", icon: Globe, description: "Explore the world, its countries, and landmarks.", translationKey: "geography", descriptionKey: "geographyDescription" },
  { name: "Randomized", icon: Shuffle, description: "Let fate decide your quiz topic!", translationKey: "randomized", descriptionKey: "randomizedDescription", popular: true },
];

const quizTopicPool: TranslationKey[] = ["science", "history", "gaming", "movies", "sports", "geography"];

interface RankInfo {
  nameKey: TranslationKey;
  icon: LucideIcon;
  colorClass: string;
  nextThreshold?: number;
}

const calculateRankAndStyle = (points: number): RankInfo => {
  if (points <= 25) return { nameKey: 'rankSeed', icon: Leaf, colorClass: 'bg-green-500 text-green-50', nextThreshold: 26 };
  if (points <= 75) return { nameKey: 'rankSprout', icon: Sprout, colorClass: 'bg-lime-500 text-lime-50', nextThreshold: 76 };
  if (points <= 150) return { nameKey: 'rankBuddingBrain', icon: BrainCircuit, colorClass: 'bg-yellow-500 text-yellow-50', nextThreshold: 151 };
  if (points <= 250) return { nameKey: 'rankKeenThinker', icon: Glasses, colorClass: 'bg-amber-500 text-amber-50', nextThreshold: 251 };
  if (points <= 400) return { nameKey: 'rankSharpMind', icon: Diamond, colorClass: 'bg-orange-500 text-orange-50', nextThreshold: 401 };
  if (points <= 600) return { nameKey: 'rankKnowledgeable', icon: BookOpen, colorClass: 'bg-sky-500 text-sky-50', nextThreshold: 601 };
  if (points <= 850) return { nameKey: 'rankInsightful', icon: Eye, colorClass: 'bg-blue-500 text-blue-50', nextThreshold: 851 };
  if (points <= 1100) return { nameKey: 'rankWise', icon: ScrollText, colorClass: 'bg-indigo-500 text-indigo-50', nextThreshold: 1101 };
  if (points <= 1400) return { nameKey: 'rankSage', icon: Award, colorClass: 'bg-violet-500 text-violet-50', nextThreshold: 1401 };
  if (points <= 1750) return { nameKey: 'rankVirtuoso', icon: Sparkles, colorClass: 'bg-purple-500 text-purple-50', nextThreshold: 1751 };
  if (points <= 2100) return { nameKey: 'rankMaestro', icon: Crown, colorClass: 'bg-fuchsia-500 text-fuchsia-50', nextThreshold: 2101 };
  return { nameKey: 'rankOracle', icon: Gem, colorClass: 'bg-pink-500 text-pink-50' };
};


export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [customTopic, setCustomTopic] = useState("");
  const [suggestedTopic, setSuggestedTopic] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { t, dir } = useLanguage();
  const { currentUser } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('smart');

  const handleStartQuiz = (topicOrTranslationKey: string) => {
    let finalTopic = topicOrTranslationKey;

    if (topicOrTranslationKey.trim() === "") {
      toast({
        title: t('topicCannotBeEmpty'), 
        description: t('topicCannotBeEmptyDescription'), 
        variant: "destructive",
      });
      return;
    }

    if (topicOrTranslationKey === t('randomized')) {
        const randomTopicKey = quizTopicPool[Math.floor(Math.random() * quizTopicPool.length)];
        finalTopic = t(randomTopicKey);
        toast({
          title: t('topicSuggestionTitle'),
          description: t('randomTopicSelectedDescription', { topic: finalTopic }),
        });
    }
    router.push(`/quiz/${encodeURIComponent(finalTopic)}?difficulty=${selectedDifficulty}`);
  };

  const handleSuggestTopic = async () => {
    setIsSuggesting(true);
    try {
      const result = await suggestTopics({ userPreferences: "general knowledge" });
      if (result.suggestedTopics && result.suggestedTopics.length > 0) {
        const randomTopic = result.suggestedTopics[Math.floor(Math.random() * result.suggestedTopics.length)];
        setSuggestedTopic(randomTopic);
        toast({
          title: t('topicSuggestionTitle'),
          description: t('topicSuggestedDescription', { topic: randomTopic }),
        });
      } else {
        toast({
          title: t('suggestionFailedTitle'),
          description: t('suggestionFailedDescription'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: (error as Error).message || t('failedToSuggestTopicError'),
        variant: "destructive",
      });
    }
    setIsSuggesting(false);
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const customTopicCardStyle: React.CSSProperties = {
    backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2Fai%20custom.webp?alt=media&token=4d961c6c-0fcb-4350-9364-1daf72e024d5')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const multiplayerCardStyle: React.CSSProperties = {
    backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2Fsdas.png?alt=media&token=cc4f61c0-e2c0-4bde-8dbd-2bbf555fc399')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const difficultyLevels: { labelKey: TranslationKey; value: Difficulty; icon: React.ElementType }[] = [
    { labelKey: 'difficultyEasy', value: 'easy', icon: Star },
    { labelKey: 'difficultySmart', value: 'smart', icon: Brain },
    { labelKey: 'difficultyMaster', value: 'master', icon: Award },
  ];

  const rankInfo = currentUser ? calculateRankAndStyle(currentUser.totalQuizPoints || 0) : null;
  const RankIcon = rankInfo?.icon;

  return (
    <div className="flex flex-col items-center space-y-4 sm:space-y-6 md:space-y-8">
      <header className="text-center space-y-2 mb-2">
        {currentUser && rankInfo && RankIcon ? (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground">{t('yourCurrentRank')}</p>
            <Badge className={cn("px-4 py-1.5 text-base font-semibold shadow-md", rankInfo.colorClass)}>
              <RankIcon className={cn("h-4 w-4", dir === 'rtl' ? 'ml-2' : 'mr-2')} />
              {t(rankInfo.nameKey)}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {t('overallPoints')}: <span className="font-semibold text-primary">{currentUser.totalQuizPoints || 0}</span>
            </p>
            <p className="text-base text-muted-foreground mt-1">{t('chooseCategoryOrAISurprise')}</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-primary">{t('quizy')}</h1>
            <p className="text-lg text-muted-foreground">{t('chooseCategoryOrAISurprise')}</p>
          </>
        )}
      </header>

      <section className="w-full max-w-2xl px-4 space-y-3 mb-4 text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">{t('chooseYourChallenge')}</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {difficultyLevels.map((level) => (
            <Button
              key={level.value}
              variant={selectedDifficulty === level.value ? 'default' : 'outline'}
              onClick={() => setSelectedDifficulty(level.value)}
              className="text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
              size="sm"
            >
              <level.icon className={cn("h-3.5 w-3.5", dir === 'rtl' ? 'ml-1.5' : 'mr-1.5')} />
              {t(level.labelKey)}
            </Button>
          ))}
        </div>
      </section>

      <section className="w-full max-w-5xl px-2 grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card
          style={customTopicCardStyle}
          className="overflow-hidden hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus-within:scale-105 focus-within:shadow-2xl"
          data-ai-hint="custom topic ai quiz"
        >
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary-foreground [text-shadow:0_2px_4px_rgba(0,0,0,0.75)]">
              <Wand2 className="text-primary-foreground h-5 w-5"/> {t('customTopic')}
              <span className="text-xs bg-primary-foreground text-primary px-1.5 py-0.5 rounded-full flex items-center gap-1 ml-1">
                <Flame className="w-3 h-3" /> {t('popular')}
              </span>
            </CardTitle>
            <CardDescription className="text-sm font-medium text-gray-200 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">{t('enterYourOwnTopic')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="custom-topic" className="text-sm text-gray-200 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">{t('enterTopicPlaceholder')}</Label>
              <Input
                id="custom-topic"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={t('enterTopicPlaceholder')}
                className="mt-1 h-9 text-sm"
              />
            </div>
              {suggestedTopic && (
              <div className="p-2 bg-black/50 rounded-md">
                <p className="text-xs text-gray-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{t('suggestedByAI')}</p>
                <p className="font-semibold text-sm text-primary-foreground [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]">{suggestedTopic}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-0.5 text-xs text-primary-foreground hover:text-accent [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]"
                  onClick={() => handleStartQuiz(suggestedTopic)}
                >
                  {t('useThisTopic')} <ArrowIcon className="ms-1 h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => handleStartQuiz(customTopic)}
              className="w-full sm:w-auto flex-1 bg-primary/80 hover:bg-primary/90 text-primary-foreground"
              disabled={!customTopic.trim()}
              size="sm"
            >
              <Sparkles className="me-2 h-4 w-4" /> {t('startCustomQuiz')}
            </Button>
            <Button
              onClick={handleSuggestTopic}
              variant="outline"
              className="w-full sm:w-auto bg-transparent text-primary-foreground border-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              disabled={isSuggesting}
              size="sm"
            >
              {isSuggesting ? <LoadingSpinner size={16} className="me-2 text-primary-foreground"/> : <Wand2 className="me-2 h-4 w-4 text-primary-foreground" />}
              {t('suggestATopic')}
            </Button>
          </CardFooter>
        </Card>

        <Link href="/multiplayer" passHref className="block">
          <Card
            style={multiplayerCardStyle}
            className="overflow-hidden hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus-within:scale-105 focus-within:shadow-2xl cursor-pointer h-full flex flex-col"
            data-ai-hint="multiplayer online challenge"
          >
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Users className="w-6 h-6 text-primary-foreground" />
              <CardTitle className="text-xl font-bold text-primary-foreground [text-shadow:0_2px_4px_rgba(0,0,0,0.75)]">
                {t('multiplayerMode')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription className="text-sm font-medium text-gray-200 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">
                {t('multiplayerModeDescription')}
              </CardDescription>
            </CardContent>
            <CardFooter className="p-1 pt-0 mt-auto">
              {/* Button removed as per user request, card is clickable via Link */}
            </CardFooter>
          </Card>
        </Link>
      </section>
      
      <section className="w-full max-w-5xl px-2">
        <h2 className="text-xl font-semibold text-foreground mb-3 text-center">{t('predefinedCategories')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {predefinedCategories.map((category) => {
            let cardStyle: React.CSSProperties = {};
            let categoryIconColor = "text-primary";
            let categoryTitleColor = "text-foreground"; 
            let categoryDescriptionColor = "text-muted-foreground"; 
            let popularBadgeClasses = "bg-accent text-accent-foreground"; 
            let titleTextEnhancements = "text-base font-semibold"; 
            let descriptionTextEnhancements = "text-xs font-normal leading-tight line-clamp-2"; 
            
            const applyDarkBackgroundStyles = () => {
              categoryIconColor = "text-primary-foreground/90";
              categoryTitleColor = "text-primary-foreground [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]";
              categoryDescriptionColor = "text-gray-200/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]";
              popularBadgeClasses = "bg-primary-foreground/80 text-primary";
            };

            if (category.translationKey === 'history') {
              cardStyle = { backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2FHistory.png?alt=media&token=8869be73-945d-4564-bf56-a9082a1b3c71')`, backgroundSize: 'cover', backgroundPosition: 'center' };
              applyDarkBackgroundStyles();
            } else if (category.translationKey === 'gaming') {
              cardStyle = { backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2Fgaming.jpeg?alt=media&token=a93d2c22-4913-460e-a223-060fcfb7ea5b')`, backgroundSize: 'cover', backgroundPosition: 'center' };
              applyDarkBackgroundStyles();
            } else if (category.translationKey === 'movies') {
              cardStyle = { backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2Fmovies.webp?alt=media&token=8e54618d-1121-409a-9ef6-5b6676898ac3')`, backgroundSize: 'cover', backgroundPosition: 'center' };
              applyDarkBackgroundStyles();
            } else if (category.translationKey === 'science') {
              cardStyle = { backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2Fscinece.jpg?alt=media&token=1a45fd0b-d723-4d95-88ac-439ede80eb42')`, backgroundSize: 'cover', backgroundPosition: 'center' };
              applyDarkBackgroundStyles();
            } else if (category.translationKey === 'sports') {
              cardStyle = { backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2Fsport.jpeg?alt=media&token=e83f2e60-bde3-4082-91ce-3cf843dab318')`, backgroundSize: 'cover', backgroundPosition: 'center' };
              applyDarkBackgroundStyles();
            } else if (category.translationKey === 'geography') {
              cardStyle = { backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2F2821_Geography_1200x408.rev.1746828804.jpg?alt=media&token=5adf1904-ecc0-489e-86b0-1ff46f353fab')`, backgroundSize: 'cover', backgroundPosition: 'center' };
              applyDarkBackgroundStyles();
            } else if (category.translationKey === 'randomized') {
                cardStyle = { backgroundImage: `url('https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/images%2FiStock-826472146.jpg?alt=media&token=89695f65-3326-4d7a-93d5-f9d059e77488')`, backgroundSize: 'cover', backgroundPosition: 'center' };
                applyDarkBackgroundStyles();
            }

            return (
              <Card
                key={category.name}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:scale-105 focus-within:scale-105 focus-within:shadow-xl cursor-pointer flex flex-col p-2 min-h-[120px]" 
                style={cardStyle}
                onClick={() => handleStartQuiz(t(category.translationKey as TranslationKey))}
                data-ai-hint={`${category.name.toLowerCase()} quiz`}
              >
                <CardHeader className="flex flex-row items-center gap-2 p-1 pb-0.5"> 
                  <category.icon className={cn("w-5 h-5", categoryIconColor)} /> 
                  <CardTitle className={cn("flex items-center gap-1", categoryTitleColor, titleTextEnhancements)}> 
                    {t(category.translationKey as TranslationKey)}
                    {category.popular && (
                      <span className={cn("text-[10px] px-1 py-0 rounded-full flex items-center gap-0.5 ml-1", popularBadgeClasses)}> 
                        <Flame className="w-2 h-2" /> {t('popular')}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-1 pt-0 flex-grow"> 
                  <CardDescription className={cn(categoryDescriptionColor, descriptionTextEnhancements)}> 
                    {t(category.descriptionKey as TranslationKey)}
                  </CardDescription>
                </CardContent>
                <CardFooter className="p-1 pt-0 mt-auto"> 
                  {/* Button removed as per user request, card is clickable via onClick */}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
