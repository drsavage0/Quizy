import type { FC } from 'react';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  timeLeft: number;
  className?: string;
}

const TimerDisplay: FC<TimerDisplayProps> = ({ timeLeft, className }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Determine color based on time left
  const timeColor = timeLeft <= 10 && timeLeft > 0 ? 'text-red-500 animate-pulse' : 
                    timeLeft === 0 ? 'text-red-700' : 
                    'text-foreground';

  return (
    <div className={cn("text-xl font-semibold tracking-wider", timeColor, className)}>
      Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </div>
  );
};

export default TimerDisplay;
