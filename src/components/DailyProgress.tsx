import { Progress } from '@/components/ui/progress';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyProgressProps {
  todayTotal: number;
  todaySets: number;
  streak: number;
  goal?: number;
}

export const DailyProgress = ({ todayTotal, todaySets, streak, goal = 100 }: DailyProgressProps) => {
  const progress = Math.min((todayTotal / goal) * 100, 100);
  const isComplete = todayTotal >= goal;

  return (
    <div className={cn(
      "rounded-2xl border border-border bg-card p-6 transition-all duration-500",
      isComplete && "glow-primary animate-celebrate"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Today</p>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "font-mono text-5xl font-bold transition-colors",
              isComplete ? "text-gradient" : "text-foreground"
            )}>
              {todayTotal}
            </span>
            <span className="text-muted-foreground">/ {goal}</span>
          </div>
        </div>
        
        {streak > 0 && (
          <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-mono text-lg font-semibold">{streak}</span>
            <span className="text-sm text-muted-foreground">day{streak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <Progress 
        value={progress} 
        className={cn(
          "h-3 bg-muted",
          isComplete && "animate-pulse-glow"
        )}
      />

      <div className="flex justify-between mt-3 text-sm">
        <span className="text-muted-foreground">
          {todaySets} set{todaySets !== 1 ? 's' : ''} logged
        </span>
        {!isComplete && (
          <span className="text-muted-foreground">
            {goal - todayTotal} to go
          </span>
        )}
        {isComplete && (
          <span className="text-primary font-medium">
            Goal reached! 🎉
          </span>
        )}
      </div>
    </div>
  );
};
