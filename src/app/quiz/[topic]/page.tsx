
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { useQuery } from "@tanstack/react-query";
import { generateQuestions } from "@/services/aiService";
import type { GeneratedQuestion, Difficulty } from "@/types"; // Added Difficulty
import QuizQuestionUI from "@/components/quiz/QuizQuestionUI";
import ScoreDisplay from "@/components/quiz/ScoreDisplay";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import TimerDisplay from "@/components/quiz/TimerDisplay";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useSoundEffects } from "@/contexts/SoundEffectsContext";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth
import { firestoreService } from "@/services/firestoreService"; // Import firestoreService

const NUM_QUESTIONS = 20;
const QUESTION_TIME_LIMIT = 60; // 60 seconds per question
const CORRECT_ANSWER_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fcorrect%20answer%20sound%20effect-%5BAudioTrimmer.com%5D.mp3?alt=media&token=25849c0d-ac7e-4675-b23e-e522d2c4299a";
const WRONG_ANSWER_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fwrong%20answer.mp3?alt=media&token=4fa9048f-00be-4bd6-b5ed-d02854c3de94";
const TICKING_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fcounter%20.mp3?alt=media&token=5565b0e6-c950-43f9-942a-f6897e229856";
const QUESTION_AMBIENCE_SOUND_URL_1 = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fquestions%20ambience.mp3?alt=media&token=a4324013-31db-4c32-8848-079c3c7c7ea8";
const QUESTION_AMBIENCE_SOUND_URL_2 = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Fin%20quesion%20sound%20effect.mp3?alt=media&token=5ee0b3d8-38c7-4cc7-8630-153e8f47d986";
const AMBIENT_SOUND_URLS = [QUESTION_AMBIENCE_SOUND_URL_1, QUESTION_AMBIENCE_SOUND_URL_2];
const LOADING_SOUND_URL = "https://firebasestorage.googleapis.com/v0/b/quizwiz-72ij0.firebasestorage.app/o/sound%20effects%2Floading%20screen.mp3?alt=media&token=12c56562-9fc7-42ae-a9f0-5a594b613c12";


export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); 
  const { currentUser } = useAuth(); // Get currentUser

  const topic = decodeURIComponent(params.topic as string);
  const difficultyParam = searchParams.get("difficulty") as Difficulty | null;
  const difficulty = difficultyParam || 'smart'; 

  const { playSoundEffect, areSoundEffectsMuted } = useSoundEffects();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<GeneratedQuestion[]>([]);
  
  const [isAttemptFinished, setIsAttemptFinished] = useState(false);
  const [userSelectedAnswerIndex, setUserSelectedAnswerIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);

  const tickingSoundRef = useRef<HTMLAudioElement | null>(null);
  const questionAmbienceSoundRef = useRef<HTMLAudioElement | null>(null);
  const loadingSoundRef = useRef<HTMLAudioElement | null>(null);

  const { data: quizData, isLoading, error, refetch } = useQuery({
    queryKey: ["quiz", topic, difficulty], 
    queryFn: () => generateQuestions({ topic, numQuestions: NUM_QUESTIONS, difficulty }), 
    enabled: !!topic, 
    staleTime: 0,
    gcTime: 0,   
    retry: 1, 
  });

  const handleAnswerSubmit = useCallback((selectedIndex: number | null) => {
    if (isAttemptFinished) return; 

    if (tickingSoundRef.current && !tickingSoundRef.current.paused) {
        tickingSoundRef.current.pause();
        tickingSoundRef.current.currentTime = 0;
    }

    setTimerActive(false); 
    setIsAttemptFinished(true);
    setUserSelectedAnswerIndex(selectedIndex);

    if (selectedIndex !== null) { 
      const currentQ = quizQuestions[currentQuestionIndex];
      if (currentQ) {
        if (selectedIndex === currentQ.correctAnswerIndex) {
          setScore((prevScore) => prevScore + 1);
          playSoundEffect(CORRECT_ANSWER_SOUND_URL); 
        } else {
          playSoundEffect(WRONG_ANSWER_SOUND_URL); 
        }
      }
    }
  }, [isAttemptFinished, quizQuestions, currentQuestionIndex, playSoundEffect]); 
  
  useEffect(() => {
    if (quizData?.questions) {
      setQuizQuestions(quizData.questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setIsAttemptFinished(false);
      setUserSelectedAnswerIndex(null);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setTimerActive(true);

      if (typeof window !== "undefined") {
        // Initialize or update Ticking Sound
        if (!tickingSoundRef.current) {
          tickingSoundRef.current = new Audio(TICKING_SOUND_URL);
          tickingSoundRef.current.loop = true;
        }
        if (tickingSoundRef.current && !tickingSoundRef.current.paused) {
          tickingSoundRef.current.pause();
          tickingSoundRef.current.currentTime = 0;
        }

        // Initialize or update Question Ambience Sound (Randomized)
        const randomAmbientUrl = AMBIENT_SOUND_URLS[Math.floor(Math.random() * AMBIENT_SOUND_URLS.length)];
        if (!questionAmbienceSoundRef.current) {
          questionAmbienceSoundRef.current = new Audio(randomAmbientUrl);
          questionAmbienceSoundRef.current.loop = true;
        } else if (questionAmbienceSoundRef.current.src !== randomAmbientUrl) {
          if (!questionAmbienceSoundRef.current.paused) {
            questionAmbienceSoundRef.current.pause();
          }
          questionAmbienceSoundRef.current.src = randomAmbientUrl;
          questionAmbienceSoundRef.current.load(); 
        }
        
        if (questionAmbienceSoundRef.current && !questionAmbienceSoundRef.current.paused) {
            questionAmbienceSoundRef.current.pause();
            questionAmbienceSoundRef.current.currentTime = 0; 
        }
        
        if (!loadingSoundRef.current) {
          loadingSoundRef.current = new Audio(LOADING_SOUND_URL);
          loadingSoundRef.current.loop = true;
        }
         if (loadingSoundRef.current && !loadingSoundRef.current.paused) {
          loadingSoundRef.current.pause();
          loadingSoundRef.current.currentTime = 0;
        }
      }
    }
  }, [quizData]);

  useEffect(() => {
    if (!timerActive || isAttemptFinished || timeLeft === 0) {
      if (timerActive && timeLeft === 0 && !isAttemptFinished) { 
        handleAnswerSubmit(null); 
      }
      setTimerActive(false); 
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerActive, timeLeft, isAttemptFinished, handleAnswerSubmit]);

  useEffect(() => {
    const audio = loadingSoundRef.current;
    if (!audio) return;

    if (isLoading && !areSoundEffectsMuted) {
      if (audio.paused) {
        audio.play().catch(e => console.warn("Loading sound play error:", e));
      }
      if (questionAmbienceSoundRef.current && !questionAmbienceSoundRef.current.paused) {
        questionAmbienceSoundRef.current.pause();
      }
      if (tickingSoundRef.current && !tickingSoundRef.current.paused) {
        tickingSoundRef.current.pause();
      }
    } else {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [isLoading, areSoundEffectsMuted]);

  useEffect(() => {
    const audio = tickingSoundRef.current;
    if (!audio || isLoading) return; 

    if (timeLeft <= 15 && timeLeft > 0 && timerActive && !isAttemptFinished && !areSoundEffectsMuted) {
      if (audio.paused) {
        audio.play().catch(e => console.warn("Ticking sound play error:", e));
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [timeLeft, timerActive, isAttemptFinished, areSoundEffectsMuted, isLoading]);

  useEffect(() => {
    const audio = questionAmbienceSoundRef.current;
    if (!audio || !quizData?.questions || isLoading) return; 

    const isQuizActive = quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length;

    if (isQuizActive && !areSoundEffectsMuted) {
      if (audio.paused) {
        audio.play().catch(e => console.warn("Question ambience sound play error:", e));
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [quizQuestions, currentQuestionIndex, areSoundEffectsMuted, quizData, isLoading]);


  const handleNextQuestion = async () => {
    if (tickingSoundRef.current && !tickingSoundRef.current.paused) {
        tickingSoundRef.current.pause();
        tickingSoundRef.current.currentTime = 0;
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setIsAttemptFinished(false);
      setUserSelectedAnswerIndex(null);
      setTimeLeft(QUESTION_TIME_LIMIT);
      setTimerActive(true); 
    } else {
      // Quiz ended
      if (questionAmbienceSoundRef.current && !questionAmbienceSoundRef.current.paused) {
        questionAmbienceSoundRef.current.pause();
      }
      // Award points if user is logged in
      if (currentUser && score > 0) {
        try {
          await firestoreService.incrementUserTotalPoints(currentUser.uid, score);
          console.log(`Awarded ${score} points to user ${currentUser.uid} for single-player quiz.`);
        } catch (e) {
          console.error("Failed to increment user total points for single-player quiz:", e);
        }
      }
      router.push(`/quiz/${encodeURIComponent(topic)}/results?score=${score}&total=${quizQuestions.length}&difficulty=${difficulty}`);
    }
  };

  useEffect(() => {
    return () => {
      const clearAudio = (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
        if (audioRef.current) {
          if (!audioRef.current.paused) {
            audioRef.current.pause();
          }
          try {
              audioRef.current.src = ''; 
              audioRef.current.removeAttribute('src');
              audioRef.current.load();
          } catch (e) {
              console.warn("Error trying to clear audio src:", e);
          }
          audioRef.current = null;
        }
      };
      clearAudio(tickingSoundRef);
      clearAudio(questionAmbienceSoundRef);
      clearAudio(loadingSoundRef);
    };
  }, []);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <LoadingSpinner size={64} />
        <p className="text-xl text-muted-foreground">Generating your {difficulty} {topic} quiz...</p>
        <p className="text-sm text-muted-foreground">This might take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Generating Quiz</AlertTitle>
          <AlertDescription>
            Could not generate questions for "{topic}" (difficulty: {difficulty}). {(error as Error).message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')}>Choose Another Topic</Button>
        <Button onClick={() => refetch()} variant="outline">Try Again</Button>
      </div>
    );
  }

  if (!quizQuestions || quizQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Alert className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>No Questions Found</AlertTitle>
          <AlertDescription>
            We couldn't find any questions for "{topic}" (difficulty: {difficulty}). Please try another topic.
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/')}>Choose Another Topic</Button>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-6">
      <header className="text-center mb-2">
         <h1 className="text-3xl font-bold text-primary">Quiz Time: {topic} ({difficulty})</h1>
      </header>
      
      <div className="sticky top-20 z-10 bg-card p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-4">
        <ScoreDisplay
          score={score}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={quizQuestions.length}
        />
        {currentQuestion && <TimerDisplay timeLeft={timeLeft} />}
      </div>


      {currentQuestion && (
        <QuizQuestionUI
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          onAnswerSubmit={handleAnswerSubmit}
          isAttemptFinished={isAttemptFinished}
          userSelectedAnswerIndex={userSelectedAnswerIndex}
          timeLeft={timeLeft}
        />
      )}

      {isAttemptFinished && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleNextQuestion} size="lg" className="w-full max-w-xs">
            {currentQuestionIndex < quizQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
          </Button>
        </div>
      )}
    </div>
  );
}
