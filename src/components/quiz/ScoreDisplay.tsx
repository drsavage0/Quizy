interface ScoreDisplayProps {
  score: number;
  currentQuestionIndex: number;
  totalQuestions: number;
}

export default function ScoreDisplay({ score, currentQuestionIndex, totalQuestions }: ScoreDisplayProps) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-lg font-semibold text-primary">
        Question: <span className="text-foreground tabular-nums">{currentQuestionIndex + 1} / {totalQuestions}</span>
      </p>
      <p className="text-lg font-semibold text-primary">
        Score: <span className="text-foreground tabular-nums">{score}</span>
      </p>
    </div>
  );
}
