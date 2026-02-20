import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePushups } from '@/hooks/usePushups';
import { useGoal } from '@/hooks/useGoal';
import { DailyProgress } from './DailyProgress';
import { QuickAdd } from './QuickAdd';
import { TodaySets } from './TodaySets';
import { StatsCards } from './StatsCards';
import { GoalSettings } from './GoalSettings';
import { Button } from '@/components/ui/button';
import { LogOut, Dumbbell, Download } from 'lucide-react';
import { ImportHistory } from './ImportHistory';
import { VariationStats } from './VariationStats';
import { CalendarView } from './CalendarView';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav, TabId } from './BottomNav';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const pendingDeleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const { user, signOut } = useAuth();
  const { goal, setGoal } = useGoal();
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
  } = usePushups(goal);

  const handleAddSet = async (reps: number, variation: string) => {
    const isNewBestSet = reps > records.bestSet && records.bestSet > 0;
    const isNewBestDay = todayTotal + reps > records.mostInDay && records.mostInDay > 0;

    try {
      await addSet.mutateAsync({ reps, variation });

      if (isNewBestSet && isNewBestDay) {
        toast('New records!', { description: `Best set (${reps}) and best day both broken` });
      } else if (isNewBestSet) {
        toast('New best set!', { description: `${reps} reps — a new personal record` });
      } else if (isNewBestDay) {
        toast('New best day!', { description: `${todayTotal + reps} reps today — a new personal record` });
      } else if (todayTotal + reps >= goal && todayTotal < goal) {
        toast(`+${reps} ${variation !== 'Standard' ? variation + ' ' : ''}pushups!`, {
          description: "Goal reached!",
        });
      } else {
        toast(`+${reps} ${variation !== 'Standard' ? variation + ' ' : ''}pushups!`, {
          description: `${Math.max(0, goal - todayTotal - reps)} more to go`,
        });
      }
    } catch {
      toast('Error', { description: 'Failed to log set. Please try again.' });
    }
  };

  const handleDeleteSet = useCallback((id: string) => {
    setPendingDeleteIds(prev => new Set(prev).add(id));

    const toastId = `delete-${id}`;
    const timer = setTimeout(async () => {
      pendingDeleteTimers.current.delete(id);
      try {
        await deleteSet.mutateAsync(id);
      } catch {
        setPendingDeleteIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        toast('Error', { description: 'Failed to delete set.' });
      }
      setPendingDeleteIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }, 5000);

    pendingDeleteTimers.current.set(id, timer);

    toast('Set removed', {
      id: toastId,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(pendingDeleteTimers.current.get(id));
          pendingDeleteTimers.current.delete(id);
          setPendingDeleteIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        },
      },
    });
  }, [deleteSet]);

  const handleExport = () => {
    const header = 'Date,Time,Reps,Variation';
    const rows = [...logs]
      .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
      .map(log => {
        const d = new Date(log.logged_at);
        return [
          format(d, 'yyyy-MM-dd'),
          format(d, 'HH:mm:ss'),
          log.reps,
          log.variation ?? 'Standard',
        ].join(',');
      });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pushups-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleTodayLogs = todayLogs.filter(log => !pendingDeleteIds.has(log.id));

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
      <div className="max-w-lg mx-auto p-4 pb-24 space-y-6">
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
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              disabled={logs.length === 0}
              className="text-muted-foreground hover:text-foreground"
              title="Export CSV"
            >
              <Download className="h-5 w-5" />
            </Button>
            <ImportHistory />
            <GoalSettings goal={goal} onSave={setGoal} />
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {activeTab === 'home' && (
          <>
            <DailyProgress
              todayTotal={todayTotal}
              todaySets={todaySets}
              streak={streak}
              goal={goal}
            />
            <QuickAdd onAdd={handleAddSet} isLoading={addSet.isPending} />
            <TodaySets
              logs={visibleTodayLogs}
              onDelete={handleDeleteSet}
              isDeleting={deleteSet.isPending}
            />
          </>
        )}

        {activeTab === 'stats' && (
          <>
            <StatsCards lifetimeTotal={lifetimeTotal} records={records} />
            <VariationStats stats={variationStats} />
          </>
        )}

        {activeTab === 'calendar' && (
          <CalendarView logs={logs} />
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
