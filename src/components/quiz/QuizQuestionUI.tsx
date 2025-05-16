
"use client";

import type { GeneratedQuestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, HelpCircle, TimerOff } from "lucide-react";

interface QuizQuestionUIProps {
  question: GeneratedQuestion;
  questionNumber: number;
  onAnswerSubmit: (selectedIndex: number | null) => void;
  isAttemptFinished: boolean;
  userSelectedAnswerIndex: number | null;
  timeLeft: number;
}

export default function QuizQuestionUI({ 
  question, 
  questionNumber, 
  onAnswerSubmit,
  isAttemptFinished,
  userSelectedAnswerIndex,
  timeLeft
}: QuizQuestionUIProps) {
  const [shakeButtonIndex, setShakeButtonIndex] = useState<number | null>(null);

  // Effect to trigger shake animation for incorrect user selections
  useEffect(() => {
    if (isAttemptFinished && userSelectedAnswerIndex !== null && userSelectedAnswerIndex !== question.correctAnswerIndex) {
      setShakeButtonIndex(userSelectedAnswerIndex);
      const timer = setTimeout(() => setShakeButtonIndex(null), 500); // Clear shake after animation
      return () => clearTimeout(timer);
    } else if (!isAttemptFinished) { // Reset shake when new question attempt starts or question changes
        setShakeButtonIndex(null);
    }
  }, [isAttemptFinished, userSelectedAnswerIndex, question]);
  
  // Reset shake explicitly when the question changes to avoid lingering shake state on fast navigation
  useEffect(() => {
    setShakeButtonIndex(null);
  }, [question]);


  const handleAnswerClick = (index: number) => {
    // Allow click only if attempt is not finished and time is left
    if (!isAttemptFinished && timeLeft > 0) {
      onAnswerSubmit(index);
    }
  };

  const getButtonVariant = (index: number) => {
    if (!isAttemptFinished) return "outline"; // Default state before answer or timeout

    // Attempt is finished (either by user or timeout)
    if (index === question.correctAnswerIndex) return "default"; // Correct answer always green (or primary)
    if (index === userSelectedAnswerIndex) return "destructive"; // User selected this, and it's wrong
    return "outline"; // Other non-selected, non-correct options
  };
  
  const isButtonDisabled = isAttemptFinished || timeLeft === 0;

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl leading-relaxed">
          <span className="text-primary mr-2">Q{questionNumber}:</span>{question.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeLeft === 0 && !isAttemptFinished && ( // This state should ideally be handled by parent setting isAttemptFinished
           <div className="my-4 p-3 bg-destructive/10 rounded-md text-center">
             <TimerOff className="mx-auto h-8 w-8 text-destructive mb-2" />
             <p className="font-semibold text-destructive">Time's up!</p>
             <p className="text-sm text-muted-foreground">The correct answer is highlighted.</p>
           </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.answers.map((answer, index) => (
            <Button
              key={index}
              variant={getButtonVariant(index)}
              size="lg" 
              className={cn(
                "justify-start text-left h-auto py-3 transition-all duration-300 ease-in-out transform hover:scale-105 focus:scale-105 items-start",
                isAttemptFinished && index === question.correctAnswerIndex && "bg-green-500 hover:bg-green-600 text-white border-green-500",
                isAttemptFinished && index === userSelectedAnswerIndex && index !== question.correctAnswerIndex && "bg-red-500 hover:bg-red-600 text-white border-red-500",
                isAttemptFinished && index !== userSelectedAnswerIndex && index !== question.correctAnswerIndex && "opacity-70",
                shakeButtonIndex === index && "animate-shake"
              )}
              onClick={() => handleAnswerClick(index)}
              disabled={isButtonDisabled}
              aria-pressed={userSelectedAnswerIndex === index}
            >
              <span className="mr-2 font-bold pt-px">{(index + 1)}.</span>
              <span className="flex-1 whitespace-normal text-left break-words">{answer}</span>
              {isAttemptFinished && userSelectedAnswerIndex === index && ( // Icon for user's pick
                userSelectedAnswerIndex === question.correctAnswerIndex ? 
                <CheckCircle className="ml-auto h-5 w-5 text-white self-center" /> : 
                <XCircle className="ml-auto h-5 w-5 text-white self-center" />
              )}
              {isAttemptFinished && userSelectedAnswerIndex !== index && index === question.correctAnswerIndex && // Icon for correct answer if not picked by user
                <HelpCircle className="ml-auto h-5 w-5 text-white self-center" />
              }
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
