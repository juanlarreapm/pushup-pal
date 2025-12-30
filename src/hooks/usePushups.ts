import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';

interface PushupLog {
  id: string;
  user_id: string;
  reps: number;
  logged_at: string;
  created_at: string;
  variation?: string | null;
}

interface VariationStats {
  variation: string;
  totalReps: number;
  bestSet: number;
  setCount: number;
}

export const usePushups = () => {
  const queryClient = useQueryClient();

  // Fetch all logs for the current user
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['pushup-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pushup_logs')
        .select('*')
        .order('logged_at', { ascending: false });
      
      if (error) throw error;
      return data as PushupLog[];
    },
  });

  // Add a new set
  const addSet = useMutation({
    mutationFn: async ({ reps, variation }: { reps: number; variation?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pushup_logs')
        .insert({ 
          user_id: user.id, 
          reps,
          variation: variation === 'Standard' ? null : variation 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushup-logs'] });
    },
  });

  // Delete a set
  const deleteSet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pushup_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushup-logs'] });
    },
  });

  // Today's pushups
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const todayLogs = logs.filter(log => {
    const logDate = new Date(log.logged_at);
    return logDate >= todayStart && logDate <= todayEnd;
  });
  const todayTotal = todayLogs.reduce((sum, log) => sum + log.reps, 0);
  const todaySets = todayLogs.length;

  // Lifetime total
  const lifetimeTotal = logs.reduce((sum, log) => sum + log.reps, 0);

  // Calculate streak
  const calculateStreak = (): number => {
    const today = startOfDay(new Date());
    const DAILY_GOAL = 100;
    
    // Group logs by day
    const dailyTotals: Map<string, number> = new Map();
    logs.forEach(log => {
      const day = format(startOfDay(new Date(log.logged_at)), 'yyyy-MM-dd');
      dailyTotals.set(day, (dailyTotals.get(day) || 0) + log.reps);
    });

    let streak = 0;
    let checkDate = today;
    
    // Check if today is complete - if not, start from yesterday
    const todayKey = format(today, 'yyyy-MM-dd');
    const todayDone = (dailyTotals.get(todayKey) || 0) >= DAILY_GOAL;
    
    if (!todayDone) {
      checkDate = subDays(today, 1);
    }

    // Count consecutive days meeting goal
    while (true) {
      const dateKey = format(checkDate, 'yyyy-MM-dd');
      const dayTotal = dailyTotals.get(dateKey) || 0;
      
      if (dayTotal >= DAILY_GOAL) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Personal records
  const calculateRecords = () => {
    if (logs.length === 0) {
      return { bestSet: 0, longestStreak: 0, mostInDay: 0 };
    }

    // Best single set
    const bestSet = Math.max(...logs.map(log => log.reps));

    // Group by day for daily totals
    const dailyTotals: Map<string, number> = new Map();
    logs.forEach(log => {
      const day = format(startOfDay(new Date(log.logged_at)), 'yyyy-MM-dd');
      dailyTotals.set(day, (dailyTotals.get(day) || 0) + log.reps);
    });

    // Most in a day
    const mostInDay = Math.max(...Array.from(dailyTotals.values()));

    // Longest streak calculation
    const DAILY_GOAL = 100;
    const completedDays = Array.from(dailyTotals.entries())
      .filter(([_, total]) => total >= DAILY_GOAL)
      .map(([date, _]) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < completedDays.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const daysDiff = differenceInCalendarDays(completedDays[i], completedDays[i - 1]);
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    return { bestSet, longestStreak, mostInDay };
  };

  // Weekly data for charts
  const getWeeklyData = () => {
    const today = new Date();
    const weekAgo = subDays(today, 6);
    const days = eachDayOfInterval({ start: weekAgo, end: today });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.logged_at);
        return logDate >= dayStart && logDate <= dayEnd;
      });
      const total = dayLogs.reduce((sum, log) => sum + log.reps, 0);
      
      return {
        date: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        total,
        goal: 100,
      };
    });
  };

  // Monthly data for charts
  const getMonthlyData = () => {
    const today = new Date();
    const monthAgo = subDays(today, 29);
    const days = eachDayOfInterval({ start: monthAgo, end: today });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayLogs = logs.filter(log => {
        const logDate = new Date(log.logged_at);
        return logDate >= dayStart && logDate <= dayEnd;
      });
      const total = dayLogs.reduce((sum, log) => sum + log.reps, 0);
      
      return {
        date: format(day, 'd'),
        fullDate: format(day, 'MMM d'),
        total,
        goal: 100,
      };
    });
  };

  // Variation stats
  const calculateVariationStats = (): VariationStats[] => {
    const statsMap: Map<string, { totalReps: number; bestSet: number; setCount: number }> = new Map();
    
    logs.forEach(log => {
      const variation = log.variation || 'Standard';
      const existing = statsMap.get(variation) || { totalReps: 0, bestSet: 0, setCount: 0 };
      statsMap.set(variation, {
        totalReps: existing.totalReps + log.reps,
        bestSet: Math.max(existing.bestSet, log.reps),
        setCount: existing.setCount + 1,
      });
    });

    return Array.from(statsMap.entries())
      .map(([variation, stats]) => ({ variation, ...stats }))
      .sort((a, b) => b.totalReps - a.totalReps);
  };

  const streak = calculateStreak();
  const records = calculateRecords();
  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const variationStats = calculateVariationStats();

  return {
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
  };
};
