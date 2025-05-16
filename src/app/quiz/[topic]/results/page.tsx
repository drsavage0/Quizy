
"use client";

import { useSearchParams } from "next/navigation";
import { useParams } from "next/navigation";
import QuizEndSummary from "@/components/quiz/QuizEndSummary";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Difficulty } from "@/types";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const routeParams = useParams();
  
  const scoreStr = searchParams.get("score");
  const totalStr = searchParams.get("total");
  const difficulty = searchParams.get("difficulty") as Difficulty | null; // Read difficulty
  const topic = decodeURIComponent(routeParams.topic as string);

  if (scoreStr === null || totalStr === null || !topic || !difficulty) { // Check difficulty
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Displaying Results</AlertTitle>
          <AlertDescription>
            Quiz results are missing or invalid.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  const score = parseInt(scoreStr, 10);
  const totalQuestions = parseInt(totalStr, 10);

  if (isNaN(score) || isNaN(totalQuestions)) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Invalid Score Data</AlertTitle>
          <AlertDescription>
            The score data received is not valid.
          </AlertDescription>
        </Alert>
         <Button asChild>
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 flex justify-center">
      {/* Pass difficulty to QuizEndSummary if it needs to display it */}
      <QuizEndSummary score={score} totalQuestions={totalQuestions} topic={topic} difficulty={difficulty} />
    </div>
  );
}
