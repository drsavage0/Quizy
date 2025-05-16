
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, ChevronLeft, ChevronRight, Clock, UserCircle, XCircle, Loader2, ShieldAlert, Swords, ShieldCheck, Users, Brain, Award } from "lucide-react";
import Link from "next/link";
import { useLanguage, type TranslationKey } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { firestoreService } from "@/services/firestoreService";
import type { ScoreAttackGameData, PlayerGameState, GeneratedQuestion, UserProfile } from "@/types";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useParams, useRouter } from "next/navigation";
import { useSoundEffects } from "@/contexts/SoundEffectsContext";
import { generateQuestions } from "@/services/aiService";
import { doc, getDoc } from "firebase/firestore"; // Added getDoc
import { db } from "@/lib/firebase"; // Added db

const TOTAL_QUESTIONS = 20;
const ROUND_TIME_LIMIT = 30; // seconds per question
const PRE_GAME_COUNTDOWN_SECONDS = 5;

// Sound URLs
const CORRECT_ANSWER_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fcorrect%20answer%20sound%20effect-%5BAudioTrimmer.com%5D.mp3?alt=media&token=25849c0d-ac7e-4675-b23e-e522d2c4299a";
const WRONG_ANSWER_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fwrong%20answer.mp3?alt=media&token=4fa9048f-00be-4bd6-b5ed-d02854c3de94";
const TICKING_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fcounter%20.mp3?alt=media&token=5565b0e6-c950-43f9-942a-f6897e229856";
const QUESTION_AMBIENCE_SOUND_URL_1 = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fquestions%20ambience.mp3?alt=media&token=a4324013-31db-4c32-8848-079c3c7c7ea8";
const QUESTION_AMBIENCE_SOUND_URL_2 = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fin%20quesion%20sound%20effect.mp3?alt=media&token=5ee0b3d8-38c7-4cc7-8630-153e8f47d986";
const AMBIENT_SOUND_URLS = [QUESTION_AMBIENCE_SOUND_URL_1, QUESTION_AMBIENCE_SOUND_URL_2];
const LOADING_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Floading%20screen.mp3?alt=media&token=12c56562-9fc7-42ae-a9f0-5a594b613c12";


type GameStage = 'loading' | 'waitingForOpponent' | 'fetchingQuestions' | 'preparingMatch' | 'active' | 'gameOver';

interface PostGameSummaryDetails {
  outcomeTextKey: TranslationKey;
  outcomeNameParam?: string; // For opponentWon or opponentAbandoned
  player1Name: string | null;
  player2Name: string | null;
  player1MatchScore: number;
  player2MatchScore: number;
  localPlayerPointsAdded: number | null;
  localPlayerNewTotalPoints: number | null;
}

const USERS_COLLECTION = "users"; // Define USERS_COLLECTION if not already defined

export default function ScoreAttackGamePage() {
  const { t, dir } = useLanguage();
  const { currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId as string;
  const { playSoundEffect, areSoundEffectsMuted } = useSoundEffects();

  const ArrowIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  const [gameSession, setGameSession] = useState<ScoreAttackGameData | null>(null);
  const [localPlayerRole, setLocalPlayerRole] = useState<'player1' | 'player2' | 'observer' | 'full' | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);
  const [gameStage, setGameStage] = useState<GameStage>('loading');
  const [preGameCountdown, setPreGameCountdown] = useState(PRE_GAME_COUNTDOWN_SECONDS);
  const [pointsAwardedForCurrentGame, setPointsAwardedForCurrentGame] = useState(false);
  const [currentAmbientTrackUrl, setCurrentAmbientTrackUrl] = useState<string | null>(null);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [summaryData, setSummaryData] = useState<PostGameSummaryDetails | null>(null);


  const soundPlayedForQuestionOutcomeRef = useRef<{[key: number]: boolean}>({});
  const prevQuestionIndexRef = useRef<number | undefined>(undefined);

  const tickingSoundRef = useRef<HTMLAudioElement | null>(null);
  const questionAmbienceSoundRef = useRef<HTMLAudioElement | null>(null);
  const loadingSoundRef = useRef<HTMLAudioElement | null>(null);

  const gameSessionRef = useRef(gameSession);
  const localPlayerRoleRef = useRef(localPlayerRole);
  const gameIdRef = useRef(gameId);
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    gameSessionRef.current = gameSession;
    localPlayerRoleRef.current = localPlayerRole;
    gameIdRef.current = gameId;
    currentUserRef.current = currentUser;
  }, [gameSession, localPlayerRole, gameId, currentUser]);

  const currentQuestionData = gameSession?.questions && gameSession.questions.length > 0 && gameSession.currentQuestionIndex < gameSession.questions.length
    ? gameSession.questions[gameSession.currentQuestionIndex] 
    : null;

  const handleAnswerSelect = useCallback(async (answerIndex: number | null) => {
    if (!currentUserRef.current || !localPlayerRoleRef.current || localPlayerRoleRef.current === 'observer' || localPlayerRoleRef.current === 'full' || !gameSessionRef.current || !currentQuestionData || (gameSessionRef.current[localPlayerRoleRef.current] as PlayerGameState)?.hasAnsweredThisRound) {
      return;
    }

    setTimerActive(false);
    if (tickingSoundRef.current && !tickingSoundRef.current.paused) {
        tickingSoundRef.current.pause();
        tickingSoundRef.current.currentTime = 0;
    }
    const gs = gameSessionRef.current;
    const lpr = localPlayerRoleRef.current;

    const isCorrect = answerIndex === currentQuestionData.correctAnswerIndex;
    const currentPlayerGameState = gs[lpr] as PlayerGameState;
    const currentScore = currentPlayerGameState?.score || 0;
    
    const updatedPlayerState: Partial<PlayerGameState> = {
      currentAnswerIndex: answerIndex,
      hasAnsweredThisRound: true,
      score: isCorrect ? currentScore + 1 : currentScore,
    };

    await firestoreService.updatePlayerStateInScoreAttack(gameIdRef.current, lpr as 'player1' | 'player2', updatedPlayerState);
    
  }, [currentQuestionData]); // Removed dependencies that are now refs
  
  const handleNextQuestion = useCallback(async () => {
    const gs = gameSessionRef.current;
    const lpr = localPlayerRoleRef.current;
    const gid = gameIdRef.current;

    if (!gs || lpr !== 'player1' || gameStage !== 'active' || !gs.questions) return; 

    const nextIndex = gs.currentQuestionIndex + 1;
    if (nextIndex < gs.questions.length) {
      await firestoreService.setScoreAttackQuestionIndex(gid, nextIndex);
    } else {
      let newStatus: ScoreAttackGameData['status'] = 'tie';
      if (gs.player1 && gs.player2) {
        if (gs.player1.score > gs.player2.score) newStatus = 'player1_won';
        else if (gs.player2.score > gs.player1.score) newStatus = 'player2_won';
      }
      await firestoreService.updateGameStatus(gid, newStatus);
    }
  }, [gameStage]); // Removed dependencies that are now refs

  useEffect(() => {
    if (!gameId) {
        setErrorMsg(t('invalidGameId')); 
        setIsLoadingGame(false);
        setGameStage('gameOver'); 
        return;
    }
    if (!currentUser) {
      setErrorMsg(t('loginRequiredToPlay'));
      setIsLoadingGame(false);
      setGameStage('gameOver');
      return;
    }
    setIsLoadingGame(true);
    setPointsAwardedForCurrentGame(false); 
    setSummaryData(null);
    setGameStage('loading');
    firestoreService.getOrCreateScoreAttackGame(gameId, currentUser.uid, currentUser.displayName, currentUser.photoURL)
      .then(({ gameData, playerRole }) => {
        if (playerRole === 'full' && gameData?.player1?.userId !== currentUser.uid && gameData?.player2?.userId !== currentUser.uid) {
          setErrorMsg(t('gameIsFull'));
          setLocalPlayerRole('full');
          setGameStage('gameOver');
        } else {
           setLocalPlayerRole(playerRole as 'player1' | 'player2' | 'observer');
        }
      })
      .catch(err => {
        console.error("Error initializing game:", err);
        setErrorMsg(t('errorJoiningGame'));
        setGameStage('gameOver');
      })
      .finally(() => {
        setIsLoadingGame(false); 
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, currentUser?.uid]); 

  useEffect(() => {
    if (!gameId || !currentUser || localPlayerRole === 'full') {
      if(localPlayerRole === 'full'){
         setIsLoadingGame(false); 
         setGameStage('gameOver');
      }
      return;
    }
     if (errorMsg && localPlayerRole !== 'player1' && localPlayerRole !== 'player2') { 
      setIsLoadingGame(false);
      setGameStage('gameOver');
      return;
    }

    const unsubscribe = firestoreService.listenToScoreAttackGame(gameId, (data) => {
      setGameSession(data);
      setIsLoadingGame(false); 

      if (!data) {
        if (localPlayerRole === 'player1' || localPlayerRole === 'player2') {
           setErrorMsg(t('gameNotFoundOrClosed')); 
           setGameStage('gameOver');
        }
        return;
      }
      
      if (['player1_won', 'player2_won', 'tie', 'abandoned'].includes(data.status)) {
        setGameStage('gameOver');
      } else if (data.status === 'waiting' && data.player1 && !data.player2) {
        setErrorMsg(null);
        setGameStage('waitingForOpponent');
      } else if (data.status === 'waiting' && data.player1 && data.player2 && (!data.questions || data.questions.length === 0)) {
        setErrorMsg(null);
        setGameStage('fetchingQuestions');
      } else if (data.player1 && data.player2 && data.questions && data.questions.length > 0) {
        if (gameStage !== 'active' && gameStage !== 'gameOver' && gameStage !== 'preparingMatch') {
          setErrorMsg(null); 
          setGameStage('preparingMatch');
        }
      }
    });
    return () => unsubscribe();
  }, [gameId, currentUser, localPlayerRole, errorMsg, t, gameStage]);

  useEffect(() => {
    const fetchQs = async () => {
      if (gameSession && gameSession.player1 && gameSession.player2 && localPlayerRole === 'player1' && (!gameSession.questions || gameSession.questions.length === 0) && !isFetchingQuestions) {
        setIsFetchingQuestions(true);
        setGameStage('fetchingQuestions'); 
        try {
          const fetchedQuestions = await generateQuestions({ topic: "General Knowledge", numQuestions: TOTAL_QUESTIONS, difficulty: "smart" });
          if (fetchedQuestions.questions && fetchedQuestions.questions.length > 0) {
            await firestoreService.setScoreAttackGameQuestions(gameId, fetchedQuestions.questions);
          } else {
            setErrorMsg(t('errorGeneratingQuestions'));
            await firestoreService.updateGameStatus(gameId, 'abandoned');
          }
        } catch (err) {
          console.error("Error fetching multiplayer questions:", err);
          setErrorMsg(t('errorGeneratingQuestions'));
          await firestoreService.updateGameStatus(gameId, 'abandoned');
        } finally {
          setIsFetchingQuestions(false);
        }
      }
    };
    fetchQs();
  }, [gameSession, localPlayerRole, gameId, isFetchingQuestions, t]);

  useEffect(() => {
    if (gameStage === 'preparingMatch') {
      setPreGameCountdown(PRE_GAME_COUNTDOWN_SECONDS);
      const intervalId = setInterval(() => {
        setPreGameCountdown(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setPointsAwardedForCurrentGame(false);
            setSummaryData(null);
            setGameStage('active');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [gameStage]);

  useEffect(() => {
    if (gameStage === 'gameOver' && gameSession && currentUser && localPlayerRole && ['player1', 'player2'].includes(localPlayerRole) && !pointsAwardedForCurrentGame) {
      let pointsAwardedOrDeducted = 0;
      let outcomeTextKey: TranslationKey = 'gameFinished';
      let outcomeNameParam: string | undefined = undefined;

      const p1Name = gameSession.player1?.displayName || t('player');
      const p2Name = gameSession.player2?.displayName || t('player');
      const p1MatchScore = gameSession.player1?.score || 0;
      const p2MatchScore = gameSession.player2?.score || 0;

      if (gameSession.status === 'player1_won') {
        outcomeTextKey = localPlayerRole === 'player1' ? 'youWon' : 'opponentWon';
        if (localPlayerRole !== 'player1') outcomeNameParam = gameSession.player1?.displayName || t('player');
        pointsAwardedOrDeducted = localPlayerRole === 'player1' ? p1MatchScore : p2MatchScore;
      } else if (gameSession.status === 'player2_won') {
        outcomeTextKey = localPlayerRole === 'player2' ? 'youWon' : 'opponentWon';
        if (localPlayerRole !== 'player2') outcomeNameParam = gameSession.player2?.displayName || t('player');
        pointsAwardedOrDeducted = localPlayerRole === 'player2' ? p2MatchScore : p1MatchScore;
      } else if (gameSession.status === 'tie') {
        outcomeTextKey = 'itsATie';
        pointsAwardedOrDeducted = (gameSession[localPlayerRole as 'player1' | 'player2'] as PlayerGameState)?.score || 0;
      } else if (gameSession.status === 'abandoned') {
        // This case assumes the local player is the stayer. The leaver's penalty is in useEffect cleanup.
        outcomeTextKey = 'opponentAbandoned';
        if (localPlayerRole === 'player1' && gameSession.player2) {
            outcomeNameParam = gameSession.player2.displayName || t('player');
        } else if (localPlayerRole === 'player2' && gameSession.player1) {
            outcomeNameParam = gameSession.player1.displayName || t('player');
        }
        pointsAwardedOrDeducted = (gameSession[localPlayerRole as 'player1' | 'player2'] as PlayerGameState)?.score || 0;
      }
      
      let localPlayerNewTotal: number | null = null;

      if (typeof pointsAwardedOrDeducted === 'number') { // Note: This doesn't handle the -20 for leaver here, that's in cleanup
        firestoreService.incrementUserTotalPoints(currentUser.uid, pointsAwardedOrDeducted)
          .then(async () => {
            console.log(`Awarded ${pointsAwardedOrDeducted} total points to user ${currentUser.uid} for game ${gameId}`);
            // Fetch the updated user profile to get the most current totalQuizPoints
            const userDocRef = doc(db, USERS_COLLECTION, currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            const updatedUserProfile = userDocSnap.data() as UserProfile | undefined;
            localPlayerNewTotal = updatedUserProfile?.totalQuizPoints ?? ((currentUser.totalQuizPoints || 0) + pointsAwardedOrDeducted);
            
            setSummaryData({
              outcomeTextKey,
              outcomeNameParam,
              player1Name: p1Name,
              player2Name: p2Name,
              player1MatchScore: p1MatchScore,
              player2MatchScore: p2MatchScore,
              localPlayerPointsAdded: pointsAwardedOrDeducted,
              localPlayerNewTotalPoints: localPlayerNewTotal,
            });
          })
          .catch(e => {
            console.error("Failed to increment user total points for game:", e);
            setSummaryData({ 
              outcomeTextKey,
              outcomeNameParam,
              player1Name: p1Name,
              player2Name: p2Name,
              player1MatchScore: p1MatchScore,
              player2MatchScore: p2MatchScore,
              localPlayerPointsAdded: pointsAwardedOrDeducted,
              localPlayerNewTotalPoints: null, 
            });
          });
      } else {
         setSummaryData({
            outcomeTextKey,
            outcomeNameParam,
            player1Name: p1Name,
            player2Name: p2Name,
            player1MatchScore: p1MatchScore,
            player2MatchScore: p2MatchScore,
            localPlayerPointsAdded: null,
            localPlayerNewTotalPoints: null,
         });
      }
      setPointsAwardedForCurrentGame(true);
    } else if (gameStage === 'gameOver' && gameSession && localPlayerRole === 'observer' && !summaryData) {
        let outcomeTextKey: TranslationKey = 'gameFinished';
        let outcomeNameParam: string | undefined = undefined;
        if (gameSession.status === 'player1_won') { outcomeTextKey = 'opponentWon'; outcomeNameParam = gameSession.player1?.displayName || t('player'); }
        else if (gameSession.status === 'player2_won') { outcomeTextKey = 'opponentWon'; outcomeNameParam = gameSession.player2?.displayName || t('player'); }
        else if (gameSession.status === 'tie') { outcomeTextKey = 'itsATie'; }
        else if (gameSession.status === 'abandoned') { 
          outcomeTextKey = 'matchEndedDueToAbandonment'; // Generic for observer
          // Could try to determine who abandoned if needed for observer view
        }

        setSummaryData({
            outcomeTextKey,
            outcomeNameParam,
            player1Name: gameSession.player1?.displayName || t('player'),
            player2Name: gameSession.player2?.displayName || t('player'),
            player1MatchScore: gameSession.player1?.score || 0,
            player2MatchScore: gameSession.player2?.score || 0,
            localPlayerPointsAdded: null,
            localPlayerNewTotalPoints: null,
        });
    }
  }, [gameStage, gameSession, currentUser, localPlayerRole, gameId, pointsAwardedForCurrentGame, t, db]);


  useEffect(() => {
    if (!timerActive || gameStage !== 'active' || !currentQuestionData) {
      if(timerActive && timeLeft === 0 && gameStage === 'active' && currentQuestionData) {
         if (localPlayerRoleRef.current && localPlayerRoleRef.current !== 'observer' && localPlayerRoleRef.current !== 'full' && gameSessionRef.current && gameSessionRef.current[localPlayerRoleRef.current] && !gameSessionRef.current[localPlayerRoleRef.current]?.hasAnsweredThisRound) {
             handleAnswerSelect(null); 
         }
      }
      return;
    }

    if (timeLeft === 0) return;

    const intervalId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(intervalId);
  }, [timerActive, timeLeft, gameStage, currentQuestionData, handleAnswerSelect]); // Added handleAnswerSelect
 
  useEffect(() => {
    if (gameSession && gameStage === 'active' && currentQuestionData) {
        const currentPlayerState = localPlayerRole && localPlayerRole !== 'observer' && localPlayerRole !== 'full' ? gameSession[localPlayerRole] : null;
        if (currentPlayerState && !currentPlayerState.hasAnsweredThisRound) {
            setTimeLeft(ROUND_TIME_LIMIT);
            setTimerActive(true);
        } else {
            setTimerActive(false); 
        }
    } else {
        setTimerActive(false);
    }
  }, [gameSession?.currentQuestionIndex, gameStage, currentQuestionData, localPlayerRole, gameSession]);

  useEffect(() => {
    if (gameSession && localPlayerRole === 'player1' && gameStage === 'active') {
        const p1State = gameSession.player1;
        const p2State = gameSession.player2;
        if (p1State?.hasAnsweredThisRound && p2State?.hasAnsweredThisRound) {
            const advanceTimeout = setTimeout(() => {
                handleNextQuestion();
            }, 2000); 
            return () => clearTimeout(advanceTimeout);
        }
    }
  }, [gameSession, localPlayerRole, handleNextQuestion, gameStage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initAudio = (ref: React.MutableRefObject<HTMLAudioElement | null>, url: string, loop: boolean) => {
        if (!ref.current) ref.current = new Audio(url);
        ref.current.loop = loop;
        ref.current.pause();
        ref.current.currentTime = 0;
      };
      initAudio(tickingSoundRef, TICKING_SOUND_URL, true);
      initAudio(loadingSoundRef, LOADING_SOUND_URL, true);

      if (!questionAmbienceSoundRef.current) {
        questionAmbienceSoundRef.current = new Audio(); 
        questionAmbienceSoundRef.current.loop = true;
        questionAmbienceSoundRef.current.pause();
        questionAmbienceSoundRef.current.currentTime = 0;
      }
    }
    return () => { 
      const currentGS = gameSessionRef.current;
      const currentLPR = localPlayerRoleRef.current;
      const currentCID = currentUserRef.current?.uid;
      const currentGID = gameIdRef.current;

      if (currentGS && currentCID && currentGID && (currentLPR === 'player1' || currentLPR === 'player2') && currentGS.status === 'active') {
        console.log(`Player ${currentCID} is leaving active game ${currentGID}. Applying penalty.`);
        firestoreService.incrementUserTotalPoints(currentCID, -20)
          .then(() => console.log(`Applied -20 points penalty to ${currentCID}`))
          .catch(e => console.error(`Failed to apply penalty to ${currentCID}`, e));
        firestoreService.updateGameStatus(currentGID, 'abandoned')
          .then(() => console.log(`Game ${currentGID} status set to abandoned.`))
          .catch(e => console.error(`Failed to set game ${currentGID} to abandoned`, e));
      }

      const clearAudio = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
        if (audioRef.current) {
          if (!audioRef.current.paused) audioRef.current.pause();
          try { audioRef.current.src = ''; audioRef.current.removeAttribute('src'); audioRef.current.load(); } 
          catch (e) { console.warn("Error clearing audio src:", e); }
          audioRef.current = null;
        }
      };
      clearAudio(tickingSoundRef);
      clearAudio(questionAmbienceSoundRef);
      clearAudio(loadingSoundRef);
    };
  }, []); 

  useEffect(() => {
    if (gameSession?.currentQuestionIndex !== undefined && prevQuestionIndexRef.current !== gameSession.currentQuestionIndex) {
      soundPlayedForQuestionOutcomeRef.current[gameSession.currentQuestionIndex] = false;
      prevQuestionIndexRef.current = gameSession.currentQuestionIndex;
    }
  }, [gameSession?.currentQuestionIndex]);

  useEffect(() => {
    const isRoundOver = gameSession?.player1?.hasAnsweredThisRound && gameSession?.player2?.hasAnsweredThisRound;
    if ( localPlayerRole && localPlayerRole !== 'observer' && localPlayerRole !== 'full' && gameSession && gameSession[localPlayerRole] && gameSession.questions && gameSession.questions.length > 0) {
        const playerState = gameSession[localPlayerRole] as PlayerGameState;
        const questionIndex = gameSession.currentQuestionIndex;

        const shouldPlaySoundForThisPlayer = playerState.hasAnsweredThisRound && 
                                             ( (isRoundOver && gameStage === 'active') || gameStage === 'gameOver' );

        if (shouldPlaySoundForThisPlayer && questionIndex !== undefined && !soundPlayedForQuestionOutcomeRef.current[questionIndex]) {
             const question = gameSession.questions[questionIndex];
             if (question && playerState.currentAnswerIndex !== null) { 
                if (playerState.currentAnswerIndex === question.correctAnswerIndex) {
                playSoundEffect(CORRECT_ANSWER_SOUND_URL);
                } else {
                playSoundEffect(WRONG_ANSWER_SOUND_URL);
                }
                soundPlayedForQuestionOutcomeRef.current[questionIndex] = true; 
            }
        }
    }
  }, [gameSession, localPlayerRole, playSoundEffect, gameStage]);


  useEffect(() => {
    // Select ambient track only when game becomes active and track isn't already chosen for this session
    if ( (gameStage === 'preparingMatch' || gameStage === 'active') && !currentAmbientTrackUrl && gameSession?.player1 && gameSession?.player2) {
      const randomUrl = AMBIENT_SOUND_URLS[Math.floor(Math.random() * AMBIENT_SOUND_URLS.length)];
      setCurrentAmbientTrackUrl(randomUrl);
    } else if ((gameStage !== 'active' && gameStage !== 'preparingMatch') && currentAmbientTrackUrl) {
      // setCurrentAmbientTrackUrl(null); // Reset if game stage is not active/preparing. Keep it for the session.
    }
  }, [gameStage, gameSession?.player1, gameSession?.player2, currentAmbientTrackUrl]);


  useEffect(() => {
    const shouldPlayLoading = (isLoadingGame || (gameStage === 'waitingForOpponent' && localPlayerRole === 'player1') || gameStage === 'fetchingQuestions') && !areSoundEffectsMuted;
    if (loadingSoundRef.current) {
      if (shouldPlayLoading && loadingSoundRef.current.paused) {
        loadingSoundRef.current.play().catch(e => console.warn("Loading sound play error:", e));
      } else if (!shouldPlayLoading && !loadingSoundRef.current.paused) {
        loadingSoundRef.current.pause();
      }
    }
    
    const shouldPlayAmbience = gameStage === 'active' && !!currentQuestionData && !!currentAmbientTrackUrl && !areSoundEffectsMuted;
    if (questionAmbienceSoundRef.current) {
      if (currentAmbientTrackUrl && questionAmbienceSoundRef.current.src !== currentAmbientTrackUrl) {
        if (!questionAmbienceSoundRef.current.paused) questionAmbienceSoundRef.current.pause();
        questionAmbienceSoundRef.current.src = currentAmbientTrackUrl;
        questionAmbienceSoundRef.current.load(); 
        if (shouldPlayAmbience) { 
          questionAmbienceSoundRef.current.play().catch(e => console.warn("Ambience play error after src change:", e));
        }
      } else if (shouldPlayAmbience && questionAmbienceSoundRef.current.paused) {
        questionAmbienceSoundRef.current.play().catch(e => console.warn("Ambience play error:", e));
      } else if (!shouldPlayAmbience && !questionAmbienceSoundRef.current.paused) {
        questionAmbienceSoundRef.current.pause();
      }
    }
    
    const isTickingConditionMet = timeLeft <= 15 && timeLeft > 0 && timerActive && gameStage === 'active' && 
                      localPlayerRole && localPlayerRole !== 'observer' && localPlayerRole !== 'full' &&
                      gameSession && gameSession[localPlayerRole] && !gameSession[localPlayerRole]?.hasAnsweredThisRound && !areSoundEffectsMuted;
    if (tickingSoundRef.current) {
      if (isTickingConditionMet && tickingSoundRef.current.paused) {
        tickingSoundRef.current.play().catch(e => console.warn("Ticking sound play error:", e));
      } else if (!isTickingConditionMet && !tickingSoundRef.current.paused) {
        tickingSoundRef.current.pause();
      }
    }

  }, [
    isLoadingGame, gameStage, currentQuestionData, timeLeft, timerActive, localPlayerRole, 
    gameSession, 
    areSoundEffectsMuted, currentAmbientTrackUrl
  ]);


  const handleResetGame = async () => {
    if (localPlayerRole === 'player1' && gameSession) { 
        await firestoreService.resetScoreAttackGame(gameId, gameSession.player1?.userId || '', gameSession.player2?.userId || null);
        setPointsAwardedForCurrentGame(false); 
        setSummaryData(null);
        if (currentUser) { 
             setIsLoadingGame(true);
             setGameStage('loading'); 
             setTimeLeft(ROUND_TIME_LIMIT);
             setTimerActive(false);
             setCurrentAmbientTrackUrl(null); // Reset ambient track for new game
        }
    }
  }

  const bothPlayersAnsweredThisRound = !!(gameSession?.player1?.hasAnsweredThisRound && gameSession?.player2?.hasAnsweredThisRound);
  const shouldRevealAnswersGlobal = (bothPlayersAnsweredThisRound && gameStage === 'active') || gameStage === 'gameOver';


  const PlayerDisplay = ({ playerState, isOpponent = false, revealAnswersGlobal }: { 
    playerState: PlayerGameState | null, 
    isOpponent?: boolean, 
    revealAnswersGlobal: boolean 
  }) => {
    if (!playerState?.userId) { 
      return (
        <Card className={cn("w-full min-w-[150px] max-w-xs flex-1 basis-[180px] p-1", isOpponent ? "bg-secondary/60" : "bg-card")}>
          <CardHeader className="pb-1 pt-1 px-2"><CardTitle className="text-xs">{isOpponent ? t('opponent') : t('you')}</CardTitle></CardHeader>
          <CardContent className="pb-1 px-2"><p className="text-xs text-muted-foreground">{gameStage === 'waitingForOpponent' && localPlayerRole === 'player1' && !isOpponent ? t('waitingForOpponent') : t('waitingForPlayer')}</p></CardContent>
        </Card>
      );
    }
    
    const questionForDisplay = gameSession?.questions && gameSession.questions.length > 0 && gameSession.currentQuestionIndex < gameSession.questions.length
        ? gameSession.questions[gameSession.currentQuestionIndex] 
        : null;

    const showThisPlayersAnswer = revealAnswersGlobal && playerState.hasAnsweredThisRound && playerState.currentAnswerIndex !== null && questionForDisplay;

    return (
      <Card className={cn("w-full min-w-[150px] max-w-xs flex-1 basis-[180px] p-1", isOpponent ? "bg-secondary/60 shadow-inner" : "bg-card shadow-md")}>
        <CardHeader className="flex flex-row items-center gap-1.5 pb-0.5 pt-1 px-1.5">
          <Avatar className="h-6 w-6 border border-primary/50">
            <AvatarImage src={playerState.avatarUrl || `https://placehold.co/32x32.png?text=${playerState.displayName?.charAt(0)}`} alt={playerState.displayName || "Player"} data-ai-hint="player avatar" />
            <AvatarFallback className="text-xs">{playerState.displayName ? playerState.displayName.charAt(0) : <UserCircle size={12}/>}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-sm">{playerState.displayName || (isOpponent ? t('opponent') : t('you'))}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs pb-1 px-1.5">
          <p>{t('score')}: <span className="font-bold text-primary text-sm">{playerState.score}</span></p>
          {showThisPlayersAnswer && (
            <div className="mt-0.5 p-0.5 bg-background/50 rounded text-xs">
              {t('chose')}: <span className="font-semibold">{questionForDisplay!.answers[playerState.currentAnswerIndex!]}</span>
              {playerState.currentAnswerIndex === questionForDisplay!.correctAnswerIndex ? 
                <CheckCircle className="inline ms-1 h-3 w-3 text-green-500" /> : 
                <XCircle className="inline ms-1 h-3 w-3 text-red-500" />
              }
            </div>
          )}
          {!playerState.hasAnsweredThisRound && gameStage === 'active' && (
              <p className="mt-0.5 text-muted-foreground italic text-xs">{isOpponent ? t('opponentThinking') : t('yourTurnToAnswer')}</p>
          )}
          {playerState.hasAnsweredThisRound && gameStage === 'active' && !revealAnswersGlobal && (
              <p className="mt-0.5 text-yellow-600 italic text-xs">
                {isOpponent ? t('opponentSubmittedWaitingForYou') : t('answerSubmittedWaitForOpponentReveal')}
              </p>
          )}
        </CardContent>
      </Card>
    );
  };


  if (gameStage === 'loading' || isLoadingGame) {
    return <div className="container mx-auto py-2 flex flex-col justify-center items-center min-h-[calc(100vh-80px)] space-y-2">
        <LoadingSpinner size={32} /> <p className="ms-2 text-sm">{t('loadingGame')}</p>
        </div>;
  }

  if (errorMsg && (localPlayerRole !== 'player1' && localPlayerRole !== 'player2' || gameStage === 'gameOver')) { 
    return (
      <div className="container mx-auto py-2 text-center space-y-2">
         <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
        <p className="text-base text-destructive">{errorMsg}</p>
        <Button variant="outline" asChild size="sm" onClick={() => router.push('/multiplayer/lobby')}>
          <Link href="/multiplayer/lobby">
            <ArrowIcon className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
            {t('backToLobby')}
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!gameSession && (localPlayerRole === 'player1' || localPlayerRole === 'player2') && gameStage !== 'gameOver') { 
     return <div className="container mx-auto py-2 flex flex-col justify-center items-center min-h-[calc(100vh-80px)] space-y-2">
        <LoadingSpinner size={32} /> <p className="ms-2 text-sm">{t('connectingToGame')}</p>
        </div>;
  }

  if (!gameSession && localPlayerRole === 'observer' && !errorMsg && gameStage !== 'gameOver') {
    return <div className="container mx-auto py-2 flex justify-center items-center min-h-[calc(100vh-80px)]"><p className="ms-2 text-sm">{t('observingGame')}</p></div>; 
  }
  
  if (!gameSession && gameStage !== 'gameOver') {
    return <div className="container mx-auto py-2 flex flex-col justify-center items-center min-h-[calc(100vh-80px)] space-y-2">
        <p className="ms-2 text-sm">{t('errorLoadingGameData')}</p>
        <Button variant="outline" asChild size="sm" onClick={() => router.push('/multiplayer/lobby')}>
          <Link href="/multiplayer/lobby">
            <ArrowIcon className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
            {t('backToLobby')}
          </Link>
        </Button>
        </div>;
  }


  const localPlayerData = localPlayerRole && localPlayerRole !== 'observer' && localPlayerRole !== 'full' ? gameSession?.[localPlayerRole] : null;
  const opponentPlayerRole = localPlayerRole === 'player1' ? 'player2' : 'player1';
  const opponentPlayerData = gameSession?.[opponentPlayerRole];

  const showNextQuestionButton = localPlayerRole === 'player1' && bothPlayersAnsweredThisRound && gameStage === 'active' && gameSession && gameSession.questions && gameSession.currentQuestionIndex < gameSession.questions.length -1;
  const showFinishGameButton = localPlayerRole === 'player1' && bothPlayersAnsweredThisRound && gameStage === 'active' && gameSession && gameSession.questions && gameSession.currentQuestionIndex === gameSession.questions.length -1;


  if (gameStage === 'waitingForOpponent') {
    return (
      <div className="container mx-auto py-2 text-center space-y-2 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin" />
        <h1 className="text-lg font-semibold">{t('waitingForOpponent')}</h1>
        <p className="text-muted-foreground text-xs">{t('gameIdInfo', { gameId: gameId })}</p>
        <p className="text-xs text-muted-foreground">{t('shareGameIdInstruction')}</p>
         <Button variant="outline" asChild size="sm" className="mt-3" onClick={() => router.push('/multiplayer/lobby')}>
          <Link href="/multiplayer/lobby">
            <ArrowIcon className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
            {t('backToLobby')}
          </Link>
        </Button>
      </div>
    );
  }

  if (gameStage === 'fetchingQuestions') {
     return (
      <div className="container mx-auto py-2 text-center space-y-3 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] animate-fadeIn">
        <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin mb-3" />
        <h1 className="text-2xl font-bold text-primary mb-3">
          {localPlayerRole === 'player1' ? t('fetchingQuestions') : t('player1FetchingQuestions')}
        </h1>
        <p className="text-muted-foreground text-sm">{t('pleaseWait')}</p>
      </div>
    );
  }

  if (gameStage === 'preparingMatch') {
    return (
      <div className="container mx-auto py-2 text-center space-y-3 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] animate-fadeIn">
        <h1 className="text-2xl font-bold text-primary mb-3">{t('matchFound')}</h1>
        <div className="flex flex-col sm:flex-row items-center justify-around w-full max-w-md gap-3">
          <div className="flex flex-col items-center p-3 bg-card rounded-lg shadow-md min-w-[140px]">
            <Avatar className="h-16 w-16 mb-2 border-2 border-primary">
              <AvatarImage src={gameSession?.player1?.avatarUrl || undefined} alt={gameSession?.player1?.displayName || "P1"} data-ai-hint="player avatar"/>
              <AvatarFallback>{gameSession?.player1?.displayName?.charAt(0) || <UserCircle />}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground text-sm">{gameSession?.player1?.displayName || t('player')}</p>
            <p className="text-xs text-muted-foreground">{t('playerStatsComingSoon')}</p>
          </div>
          <Swords className="h-10 w-10 text-accent my-2 sm:my-0 animate-pulse" />
          <div className="flex flex-col items-center p-3 bg-card rounded-lg shadow-md min-w-[140px]">
            <Avatar className="h-16 w-16 mb-2 border-2 border-secondary">
              <AvatarImage src={gameSession?.player2?.avatarUrl || undefined} alt={gameSession?.player2?.displayName || "P2"} data-ai-hint="player avatar"/>
              <AvatarFallback>{gameSession?.player2?.displayName?.charAt(0) || <UserCircle />}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground text-sm">{gameSession?.player2?.displayName || t('player')}</p>
             <p className="text-xs text-muted-foreground">{t('playerStatsComingSoon')}</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground mt-4">{t('startingIn', { seconds: preGameCountdown })}</p>
      </div>
    );
  }
  
  if (gameStage === 'gameOver' && summaryData) { 
    return (
      <div className="container mx-auto py-2 text-center space-y-3 animate-fadeIn">
        <Award className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold text-primary">
          {t(summaryData.outcomeTextKey, { name: summaryData.outcomeNameParam || ''})}
        </h1>
        
        <Card className="max-w-sm mx-auto p-4 bg-card shadow-lg">
            <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                    <span className="font-medium">{summaryData.player1Name}:</span>
                    <span className="font-bold text-lg">{summaryData.player1MatchScore} {t('score')}</span>
                </div>
                 {summaryData.player2Name && // Only show P2 score if P2 exists
                  <div className="flex justify-between items-center">
                      <span className="font-medium">{summaryData.player2Name}:</span>
                      <span className="font-bold text-lg">{summaryData.player2MatchScore} {t('score')}</span>
                  </div>
                 }
                {summaryData.localPlayerPointsAdded !== null && (
                    <div className="pt-2 mt-2 border-t">
                        <p className={cn(
                           "font-semibold",
                           summaryData.localPlayerPointsAdded > 0 ? "text-green-600" : "text-red-600"
                        )}>
                           {summaryData.localPlayerPointsAdded > 0 ? t('pointsAddedToTotal') : t('pointsDeductedFromTotal')}: {summaryData.localPlayerPointsAdded > 0 ? "+" : ""}{summaryData.localPlayerPointsAdded}
                        </p>
                        <p className="text-muted-foreground">
                            {t('yourNewTotalPoints')}: {summaryData.localPlayerNewTotalPoints ?? (currentUser?.totalQuizPoints || 0)}
                        </p>
                        <p className="text-xs text-accent mt-1">{t('rankMayUpdate')}</p>
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
            {localPlayerRole === 'player1' && <Button onClick={handleResetGame} size="sm">{t('playAgainSameOpponent')}</Button>}
            <Button variant="outline" asChild size="sm" onClick={() => router.push('/multiplayer/lobby')}>
            <Link href="/multiplayer/lobby">
                <ArrowIcon className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
                {t('backToLobby')}
            </Link>
            </Button>
        </div>
      </div>
    )
  }
  
  const questionsAvailable = gameSession?.questions && gameSession.questions.length > 0;
  const numQuestionsInGame = questionsAvailable ? gameSession.questions!.length : TOTAL_QUESTIONS;

  return (
    <div className="container mx-auto py-2 space-y-1">
      <header className="text-center mb-1">
        <h1 className="text-xl font-bold tracking-tight text-primary">{t('scoreAttackTitle')}</h1>
        <p className="text-xs text-muted-foreground">
          {t('gameIdLabel')}: {gameId} 
          {opponentPlayerData?.displayName && ` ${t('vs')} ${opponentPlayerData.displayName || t('opponent')}`}
        </p>
      </header>

      <div className="flex flex-row flex-wrap justify-center items-stretch gap-2 mb-1">
        <PlayerDisplay playerState={localPlayerData} revealAnswersGlobal={shouldRevealAnswersGlobal} />
        <PlayerDisplay playerState={opponentPlayerData} isOpponent revealAnswersGlobal={shouldRevealAnswersGlobal} />
      </div>

      <Card className="w-full max-w-md mx-auto bg-card shadow-lg">
        <CardHeader className="text-center pb-1 pt-1.5 px-2">
          <CardTitle className="text-sm mb-0.5">{t('question')} {gameSession?.currentQuestionIndex !== undefined ? gameSession.currentQuestionIndex + 1 : '-'}/{numQuestionsInGame}</CardTitle>
          {gameStage === 'active' && 
          <div className="flex items-center justify-center text-xs text-accent-foreground font-semibold">
            <Clock className="me-1 h-3 w-3.5 text-accent" />
            {t('timeLeft')}: {timeLeft}s
          </div>
          }
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0.5 pb-2 px-2">
          {!questionsAvailable && gameStage === 'active' && (
             <div className="py-4 text-center">
              <Brain className="mx-auto h-8 w-8 text-primary animate-pulse" />
              <p className="text-sm text-muted-foreground mt-2">{t('loadingQuestion')}</p>
            </div>
          )}
          {currentQuestionData && questionsAvailable ? (
            <>
              <p className="text-center font-semibold text-sm min-h-[28px] flex items-center justify-center p-1 bg-muted rounded-md">{currentQuestionData.question}</p>
              <div className="grid grid-cols-1 gap-1.5">
                {currentQuestionData.answers.map((answer, index) => {
                  const isMySelectedAnswer = localPlayerData?.hasAnsweredThisRound && localPlayerData.currentAnswerIndex === index;
                  const isCorrectAnswer = index === currentQuestionData.correctAnswerIndex;
                  
                  return (
                    <Button
                      key={index}
                      variant={'outline'}
                      size="sm" 
                      className={cn(
                        "w-full justify-start text-left h-auto py-1.5 text-xs transition-all duration-150 ease-in-out",
                        !localPlayerData?.hasAnsweredThisRound && timerActive && !shouldRevealAnswersGlobal && gameStage === 'active' && "hover:bg-primary/10 hover:border-primary",
                        isMySelectedAnswer && !shouldRevealAnswersGlobal && "bg-accent/30 border-accent/50 font-semibold ring-1 ring-accent", 
                        shouldRevealAnswersGlobal && isCorrectAnswer && "bg-green-500 hover:bg-green-600 text-white border-green-500 font-semibold ring-2 ring-green-300",
                        shouldRevealAnswersGlobal && isMySelectedAnswer && !isCorrectAnswer && "bg-red-500 hover:bg-red-600 text-white border-red-500 font-semibold ring-2 ring-red-300",
                        shouldRevealAnswersGlobal && !isMySelectedAnswer && !isCorrectAnswer && "opacity-60"
                      )}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={!timerActive || (localPlayerData?.hasAnsweredThisRound ?? true) || gameStage !== 'active' || !questionsAvailable}
                    >
                      <span className="font-bold me-1.5">{String.fromCharCode(65 + index)}.</span>{answer}
                    </Button>
                  );
                })}
              </div>
            </>
          ) : (
            !isFetchingQuestions && gameStage === 'active' && <p className="text-xs">{t('loadingQuestion')}</p> 
          )}
        </CardContent>
        {(showNextQuestionButton || showFinishGameButton) && (
          <CardFooter className="justify-center pt-1 pb-2 px-2">
              <Button onClick={handleNextQuestion} size="sm">
                {showNextQuestionButton ? t('nextQuestion') : t('finishGame')}
              </Button>
          </CardFooter>
        )}
      </Card>
      
      <div className="mt-2 text-center">
        <Button variant="outline" asChild size="sm" onClick={() => router.push('/multiplayer/lobby')}>
          <Link href="/multiplayer/lobby">
            <ArrowIcon className={cn("h-4 w-4", dir === 'ltr' ? 'mr-2' : 'ml-2')} />
            {t('backToLobby')}
          </Link>
        </Button>
        {localPlayerRole === 'player1' && gameStage === 'gameOver' && !summaryData && <Button onClick={handleResetGame} variant="destructive" size="sm" className="ms-2">{t('resetGameHost')}</Button>}
      </div>
    </div>
  );
}
