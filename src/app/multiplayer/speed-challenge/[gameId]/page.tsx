
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, HelpCircle, Users, XCircle, Zap, Loader2, Swords, UserCircle as UserIcon } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { GeneratedQuestion, SpeedChallengeGameData, SpeedChallengePlayerData } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { firestoreService } from "@/services/firestoreService";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const MOCK_QUESTIONS_SPEED: GeneratedQuestion[] = [
  { question: "What is the capital of France?", answers: ["Berlin", "Madrid", "Paris", "Rome"], correctAnswerIndex: 2 },
  { question: "Which planet is known as the Red Planet?", answers: ["Earth", "Mars", "Jupiter", "Venus"], correctAnswerIndex: 1 },
  { question: "What is the largest ocean on Earth?", answers: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswerIndex: 3 },
  { question: "Who painted the Mona Lisa?", answers: ["Van Gogh", "Da Vinci", "Picasso", "Monet"], correctAnswerIndex: 1 },
  { question: "What is 2 + 2?", answers: ["3", "4", "5", "6"], correctAnswerIndex: 1 },
];

const QUESTION_TIME_LIMIT = 10; // seconds
const OPPONENT_ANSWER_DELAY_MIN = 2000; // ms
const OPPONENT_ANSWER_DELAY_MAX = 7000; // ms

type LocalGamePhase = "loading" | "lobby" | "playingSimulation" | "gameOverSimulation" | "error";


export default function SpeedChallengeGamePage() {
  const { t, dir } = useLanguage();
  const params = useParams();
  const gameId = params.gameId as string;
  const router = useRouter();
  const { currentUser } = useAuth();

  const [gameSession, setGameSession] = useState<SpeedChallengeGameData | null>(null);
  const [localPlayerRole, setLocalPlayerRole] = useState<'player1' | 'player2' | 'observer' | 'full' | null>(null);
  const [localGamePhase, setLocalGamePhase] = useState<LocalGamePhase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for the client-side simulation part
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0); // Mock opponent score
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const opponentSimulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and listen to Firestore game session
  useEffect(() => {
    if (!gameId || !currentUser) {
      if (!currentUser) setErrorMsg(t('loginRequiredToPlay'));
      else setErrorMsg(t('invalidGameId'));
      setLocalGamePhase("error");
      return;
    }

    setLocalGamePhase("loading");
    firestoreService.getOrCreateSpeedChallengeGame(gameId, currentUser.uid, currentUser.displayName, currentUser.photoURL)
      .then(({ gameData, playerRole }) => {
        if (playerRole === 'full' && gameData?.player1?.userId !== currentUser.uid && gameData?.player2?.userId !== currentUser.uid) {
          setErrorMsg(t('gameIsFull'));
          setLocalPlayerRole('full');
          setLocalGamePhase("error");
        } else {
          setLocalPlayerRole(playerRole as 'player1' | 'player2' | 'observer');
          if (!gameData) { // Should not happen if getOrCreate works
            setErrorMsg(t('errorJoiningGame'));
            setLocalGamePhase("error");
          }
        }
      })
      .catch(err => {
        console.error("Error initializing speed challenge game:", err);
        setErrorMsg(t('errorJoiningGame'));
        setLocalGamePhase("error");
      });
  }, [gameId, currentUser, t]);

  useEffect(() => {
    if (!gameId || !currentUser || localPlayerRole === 'full' || localPlayerRole === 'observer') return;

    const unsubscribe = firestoreService.listenToSpeedChallengeGame(gameId, (data) => {
      setGameSession(data);
      if (data) {
        if (data.status === 'active' && localGamePhase !== 'playingSimulation' && localGamePhase !== 'gameOverSimulation') {
          // Both players are ready, and game is set to active by P1
          // Start local simulation for both
          setLocalGamePhase("playingSimulation");
          // Reset local simulation state
          setCurrentQuestionIndex(0);
          setPlayerScore(0);
          setOpponentScore(0);
          loadNextQuestionSimulation(); // Start the simulation
        } else if (data.status === 'waiting' && localGamePhase !== 'playingSimulation' && localGamePhase !== 'gameOverSimulation') {
          setLocalGamePhase("lobby");
        }
      } else {
        // Game deleted or error
        setErrorMsg(t('gameNotFoundOrClosed'));
        setLocalGamePhase("error");
      }
    });
    return () => unsubscribe();
  }, [gameId, currentUser, localPlayerRole, localGamePhase]); // Added localGamePhase

  const handleStartGameByHost = async () => {
    if (localPlayerRole === 'player1' && gameSession?.player2 && gameSession.status === 'waiting') {
      await firestoreService.updateSpeedChallengeGameStatus(gameId, 'active');
      // Listener will pick up 'active' status and transition both players to simulation
    }
  };

  // --- Client-Side Simulation Logic ---
  const loadNextQuestionSimulation = useCallback(() => {
    if (currentQuestionIndex < MOCK_QUESTIONS_SPEED.length) {
      setCurrentQuestion(MOCK_QUESTIONS_SPEED[currentQuestionIndex]);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setFeedbackMessage("");
      setSelectedAnswerIndex(null);
      setIsAnswerCorrect(null);
      setCurrentQuestionIndex(prev => prev + 1);
      // Simulation game phase control, not localGamePhase
      // setGamePhase("active"); // This was from the old pure client-side state
    } else {
      // Simulation ends
      setLocalGamePhase("gameOverSimulation");
      setFeedbackMessage(t('quizCompleteTitle') + ` ${t('finalScore')}: ${playerScore} - ${opponentScore}`);
    }
  }, [currentQuestionIndex, playerScore, opponentScore, t]);

  useEffect(() => {
    if (localGamePhase === "playingSimulation" && currentQuestionIndex === 0) {
      loadNextQuestionSimulation();
    }
  }, [localGamePhase, currentQuestionIndex, loadNextQuestionSimulation]);


  useEffect(() => {
    // Timer for the simulation
    if (localGamePhase === "playingSimulation" && timeLeft > 0 && selectedAnswerIndex === null) {
      simulationTimerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && localGamePhase === "playingSimulation" && selectedAnswerIndex === null) {
      setFeedbackMessage(t('timesUp'));
      // Simulate round over
      if (opponentSimulationTimerRef.current) clearTimeout(opponentSimulationTimerRef.current);
      // No real gamePhase here, just feedback
    }
    return () => {
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    };
  }, [localGamePhase, timeLeft, selectedAnswerIndex, t]);

  useEffect(() => {
    // Mock Opponent for simulation
    if (localGamePhase === "playingSimulation" && currentQuestion && selectedAnswerIndex === null && timeLeft > 0) {
      const opponentDelay = Math.random() * (OPPONENT_ANSWER_DELAY_MAX - OPPONENT_ANSWER_DELAY_MIN) + OPPONENT_ANSWER_DELAY_MIN;
      opponentSimulationTimerRef.current = setTimeout(() => {
        if (localGamePhase === "playingSimulation" && selectedAnswerIndex === null && timeLeft > 0) { 
          setFeedbackMessage(t('opponentAnsweredFirst'));
          setOpponentScore(prev => prev + (Math.random() > 0.3 ? 1 : 0)); 
          if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
          // No real gamePhase here, just feedback
        }
      }, opponentDelay);
    }
    return () => {
      if (opponentSimulationTimerRef.current) clearTimeout(opponentSimulationTimerRef.current);
    };
  }, [localGamePhase, currentQuestion, selectedAnswerIndex, timeLeft, t]);

  const handleAnswerSelectSimulation = (answerIndex: number) => {
    if (localGamePhase !== "playingSimulation" || selectedAnswerIndex !== null) return;

    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    if (opponentSimulationTimerRef.current) clearTimeout(opponentSimulationTimerRef.current);

    setSelectedAnswerIndex(answerIndex);
    const question = MOCK_QUESTIONS_SPEED[currentQuestionIndex -1]; 
    if (question) {
      const correct = answerIndex === question.correctAnswerIndex;
      setIsAnswerCorrect(correct);
      if (correct) {
        setPlayerScore(prev => prev + 1);
        setFeedbackMessage(t('correctAnswer'));
      } else {
        setFeedbackMessage(t('incorrectAnswer'));
      }
    }
    // No real gamePhase update, this is round-end simulation
  };
  // --- End Client-Side Simulation Logic ---

  const getButtonVariantSimulation = (index: number) => {
    if (selectedAnswerIndex !== null) { // Answered or round over
      const question = MOCK_QUESTIONS_SPEED[currentQuestionIndex -1];
      if (!question) return "outline";
      if (index === question.correctAnswerIndex) return "default"; 
      if (index === selectedAnswerIndex && !isAnswerCorrect) return "destructive"; 
    }
    return "outline";
  };
  
  const isButtonDisabledSimulation = selectedAnswerIndex !== null || timeLeft === 0;

  if (localGamePhase === "loading") {
    return <div className="container mx-auto py-12 flex flex-col items-center text-center space-y-8"><LoadingSpinner size={48} /><p>{t('loadingGame')}...</p></div>;
  }

  if (localGamePhase === "error") {
    return (
      <div className="container mx-auto py-12 flex flex-col items-center text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-semibold text-destructive">{t('error')}</h1>
        <p className="text-muted-foreground">{errorMsg || t('errorJoiningGame')}</p>
        <Button variant="outline" asChild>
          <Link href="/multiplayer/speed-challenge/lobby">
            <ArrowLeft className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
            {t('backToLobby')}
          </Link>
        </Button>
      </div>
    );
  }
  
  if (localGamePhase === "lobby" && gameSession) {
     const player1 = gameSession.player1;
     const player2 = gameSession.player2;
     const isHost = localPlayerRole === 'player1';

     return (
      <div className="container mx-auto py-12 flex flex-col items-center text-center space-y-8">
        <Zap className="w-16 h-16 text-primary" />
        <h1 className="text-3xl font-bold text-primary">{t('speedChallengeLobbyTitle')}</h1>
        <p className="text-muted-foreground">{t('gameIdLabel')}: {gameId}</p>
        
        <Card className="w-full max-w-md p-6 shadow-lg">
          <CardHeader>
            <CardTitle>{t('gameLobby')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-around">
              <div>
                <Avatar className="mx-auto h-16 w-16 mb-2">
                  <AvatarImage src={player1?.avatarUrl || undefined} />
                  <AvatarFallback><UserIcon size={32}/></AvatarFallback>
                </Avatar>
                <p className="font-semibold">{player1?.displayName || t('player')}</p>
              </div>
              <Swords className="h-8 w-8 text-accent" />
              <div>
                {player2 ? (
                  <>
                    <Avatar className="mx-auto h-16 w-16 mb-2">
                      <AvatarImage src={player2?.avatarUrl || undefined} />
                      <AvatarFallback><UserIcon size={32}/></AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{player2?.displayName || t('player')}</p>
                  </>
                ) : (
                  <div className="text-center">
                     <Loader2 className="mx-auto h-16 w-16 animate-spin text-muted-foreground mb-2" />
                     <p className="text-muted-foreground">{t('waitingForPlayer')}...</p>
                  </div>
                )}
              </div>
            </div>

            {isHost && !player2 && (
              <p className="text-sm text-muted-foreground">{t('shareGameIdInstruction')}</p>
            )}
            {isHost && player2 && (
              <p className="text-green-600 font-semibold">{t('opponentJoined')}</p>
            )}
            {!isHost && player1 && !player2 && (
                <p className="text-sm text-muted-foreground">{t('waitingForPlayer')}...</p> // P2 waiting for P1 to show up if P2 joined a non-existent game somehow
            )}
             {!isHost && player1 && player2 && (
                <p className="text-sm text-muted-foreground">{t('waitingForHostToStart')}</p>
            )}

          </CardContent>
          <CardFooter>
            {isHost && player2 && (
              <Button onClick={handleStartGameByHost} className="w-full" size="lg">
                {t('startGame')}
              </Button>
            )}
          </CardFooter>
        </Card>

         <Button variant="outline" asChild size="lg" className="mt-8">
            <Link href="/multiplayer/speed-challenge/lobby">
                <ArrowLeft className={cn("h-5 w-5", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
                {t('backToLobby')}
            </Link>
        </Button>
      </div>
     );
  }


  if (localGamePhase === "playingSimulation" || localGamePhase === "gameOverSimulation") {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center space-y-6 max-w-2xl">
        <header className="text-center w-full">
          <div className="flex justify-center items-center mb-2">
              <Zap className="w-12 h-12 text-primary me-3" />
              <h1 className="text-3xl font-bold tracking-tight text-primary">{t('speedChallengeTitle')}</h1>
          </div>
          <p className="text-lg text-muted-foreground">{t('speedChallengeDescription')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('gameIdLabel')}: {gameId}</p>
        </header>

        <Card className="w-full shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>{t('question')} {currentQuestionIndex}/{MOCK_QUESTIONS_SPEED.length}</span>
              <div className="flex items-center text-primary font-semibold">
                <Clock className="me-1.5 h-4 w-4" />
                <span>{t('timeLeft')}: {timeLeft}s</span>
              </div>
            </div>
            <CardTitle className="text-xl md:text-2xl text-center pt-2 min-h-[60px]">
              {localGamePhase !== "gameOverSimulation" && currentQuestion?.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {localGamePhase !== "gameOverSimulation" && currentQuestion && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.answers.map((answer, index) => (
                  <Button
                    key={index}
                    variant={getButtonVariantSimulation(index)}
                    size="lg"
                    className={cn(
                      "justify-start text-left h-auto py-3 transition-all duration-150 ease-in-out",
                      isButtonDisabledSimulation && "opacity-70",
                      !isButtonDisabledSimulation && "hover:bg-primary/10 hover:border-primary focus:scale-105",
                      selectedAnswerIndex === index && isAnswerCorrect && "bg-green-500 hover:bg-green-600 text-white border-green-500",
                      selectedAnswerIndex === index && !isAnswerCorrect && "bg-red-500 hover:bg-red-600 text-white border-red-500"
                    )}
                    onClick={() => handleAnswerSelectSimulation(index)}
                    disabled={isButtonDisabledSimulation}
                  >
                    <span className="font-bold me-2">{String.fromCharCode(65 + index)}.</span>
                    {answer}
                    { selectedAnswerIndex === index && isAnswerCorrect && <CheckCircle className="ms-auto h-5 w-5"/>}
                    { selectedAnswerIndex === index && !isAnswerCorrect && <XCircle className="ms-auto h-5 w-5"/>}
                    { selectedAnswerIndex !== index && currentQuestion.correctAnswerIndex === index && <HelpCircle className="ms-auto h-5 w-5"/>}
                  </Button>
                ))}
              </div>
            )}
            {feedbackMessage && (
              <div className={cn("text-center font-semibold p-3 rounded-md", 
                  isAnswerCorrect === true && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                  isAnswerCorrect === false && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                  isAnswerCorrect === null && feedbackMessage !== t('timesUp') && feedbackMessage !== t('opponentAnsweredFirst') && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                  (feedbackMessage === t('timesUp') || feedbackMessage === t('opponentAnsweredFirst')) && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
              )}>
                  {feedbackMessage === t('correctAnswer') && <CheckCircle className="inline me-2 h-5 w-5"/>}
                  {feedbackMessage === t('incorrectAnswer') && <XCircle className="inline me-2 h-5 w-5"/>}
                  {feedbackMessage === t('timesUp') && <AlertCircle className="inline me-2 h-5 w-5"/>}
                  {feedbackMessage === t('opponentAnsweredFirst') && <Users className="inline me-2 h-5 w-5"/>}
                {feedbackMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="w-full flex justify-around items-center text-center p-3 bg-card rounded-lg shadow-md">
          <div>
            <p className="text-sm text-muted-foreground">{t('yourScore')}</p>
            <p className="text-2xl font-bold text-primary">{playerScore}</p>
          </div>
          <div className="text-2xl font-bold text-accent">VS</div>
          <div>
            <p className="text-sm text-muted-foreground">{t('opponentScore')}</p>
            <p className="text-2xl font-bold text-secondary-foreground">{opponentScore}</p>
          </div>
        </div>

        {((selectedAnswerIndex !== null || timeLeft ===0) && localGamePhase === "playingSimulation" && currentQuestionIndex <= MOCK_QUESTIONS_SPEED.length) && (
          <Button onClick={loadNextQuestionSimulation} size="lg" className="mt-4">
            {currentQuestionIndex < MOCK_QUESTIONS_SPEED.length ? t('nextQuestion') : t('viewResultsOrPlayAgain')}
          </Button>
        )}
         {localGamePhase === "gameOverSimulation" && (
            <Button onClick={() => { setLocalGamePhase("lobby"); if(gameSession) firestoreService.updateSpeedChallengeGameStatus(gameId, 'waiting'); }} size="lg" className="mt-4">
                {t('backToLobby')} 
            </Button>
         )}


        <div className="mt-6">
          <Button variant="outline" asChild size="lg">
            <Link href={`/multiplayer/speed-challenge/lobby?prevGameId=${gameId}`}>
              <ArrowLeft className={cn("h-5 w-5", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
              {t('backToLobby')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fallback for unhandled localGamePhase or no gameSession in lobby phase
  return (
    <div className="container mx-auto py-12 flex flex-col items-center text-center space-y-4">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <p className="text-muted-foreground">{t('loading')}</p>
         <Button variant="outline" asChild>
          <Link href="/multiplayer/speed-challenge/lobby">
            <ArrowLeft className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
            {t('backToLobby')}
          </Link>
        </Button>
    </div>
  );
}
