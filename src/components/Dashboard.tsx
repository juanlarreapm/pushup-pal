import { useAuth } from '@/hooks/useAuth';
import { usePushups } from '@/hooks/usePushups';
import { DailyProgress } from './DailyProgress';
import { QuickAdd } from './QuickAdd';
import { TodaySets } from './TodaySets';
import { StatsCards } from './StatsCards';

import { MotivationalQuote } from './MotivationalQuote';
import { Button } from '@/components/ui/button';
import { LogOut, Dumbbell } from 'lucide-react';
import { ImportHistory } from './ImportHistory';
import { VariationStats } from './VariationStats';
import { CalendarView } from './CalendarView';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const {
    logs,
    todayLogs,
    todayTotal,
    todaySets,
    lifetimeTotal,
    streak,
    records,
    weeklyData,
    monthlyData,
    variationStats,
    isLoading,
    addSet,
    deleteSet,
  } = usePushups();
  const { toast } = useToast();

  const handleAddSet = async (reps: number, variation: string) => {
    try {
      await addSet.mutateAsync({ reps, variation });
      toast({
        title: `+${reps} ${variation !== 'Standard' ? variation + ' ' : ''}pushups!`,
        description: todayTotal + reps >= 100 && todayTotal < 100 
          ? "🎉 You've hit your daily goal!" 
          : `${Math.max(0, 100 - todayTotal - reps)} more to go`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log set. Please try again.',
      });
    }
  };

  const handleDeleteSet = async (id: string) => {
    try {
      await deleteSet.mutateAsync(id);
      toast({
        title: 'Set removed',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete set. Please try again.',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-lg mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 pb-8 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Pushup Tracker</h1>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ImportHistory />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Daily Progress */}
        <DailyProgress
          todayTotal={todayTotal}
          todaySets={todaySets}
          streak={streak}
        />

        {/* Quick Add */}
        <QuickAdd
          onAdd={handleAddSet}
          isLoading={addSet.isPending}
        />

        {/* Today's Sets */}
        <TodaySets
          logs={todayLogs}
          onDelete={handleDeleteSet}
          isDeleting={deleteSet.isPending}
        />

        {/* Motivational Quote */}
        <MotivationalQuote />

        {/* Stats */}
        <StatsCards
          lifetimeTotal={lifetimeTotal}
          records={records}
        />

        {/* Variation Stats */}
        <VariationStats stats={variationStats} />

        {/* Calendar View */}
        <CalendarView logs={logs} />
      </div>
    </div>
  );
};
