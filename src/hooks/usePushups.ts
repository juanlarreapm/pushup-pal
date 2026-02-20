import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay } from 'date-fns';
import { DAILY_GOAL } from '@/lib/constants';
import {
  calculateStreak,
  calculateRecords,
  calculateVariationStats,
  getChartData,
  type PushupLog,
} from '@/lib/calculations';

export type { PushupLog };

export const usePushups = (goal: number = DAILY_GOAL) => {
  const queryClient = useQueryClient();

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

  const addSet = useMutation({
    mutationFn: async ({ reps, variation }: { reps: number; variation?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('pushup_logs')
        .insert({ user_id: user.id, reps, variation: variation === 'Standard' ? null : variation })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushup-logs'] });
    },
  });

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

  const todayLogs = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    return logs.filter(log => {
      const d = new Date(log.logged_at);
      return d >= todayStart && d <= todayEnd;
    });
  }, [logs]);

  const todayTotal = useMemo(
    () => todayLogs.reduce((sum, log) => sum + log.reps, 0),
    [todayLogs],
  );

  const todaySets = todayLogs.length;

  const lifetimeTotal = useMemo(
    () => logs.reduce((sum, log) => sum + log.reps, 0),
    [logs],
  );

  const streak = useMemo(() => calculateStreak(logs, goal), [logs, goal]);
  const records = useMemo(() => calculateRecords(logs, goal), [logs, goal]);
  const weeklyData = useMemo(() => getChartData(logs, 7, goal), [logs, goal]);
  const monthlyData = useMemo(() => getChartData(logs, 30, goal), [logs, goal]);
  const variationStats = useMemo(() => calculateVariationStats(logs), [logs]);

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
