import { startOfDay, subDays, format, eachDayOfInterval, endOfDay, differenceInCalendarDays } from 'date-fns';
import { DAILY_GOAL } from '@/lib/constants';

export interface PushupLog {
  id: string;
  user_id: string;
  reps: number;
  logged_at: string;
  created_at: string;
  variation?: string | null;
}

export interface VariationStats {
  variation: string;
  totalReps: number;
  bestSet: number;
  setCount: number;
}

export interface Records {
  bestSet: number;
  longestStreak: number;
  mostInDay: number;
}

export interface ChartDay {
  date: string;
  fullDate: string;
  total: number;
  goal: number;
}

/** Build a map of yyyy-MM-dd → total reps for that day */
export function buildDailyTotals(logs: PushupLog[]): Map<string, number> {
  const dailyTotals = new Map<string, number>();
  for (const log of logs) {
    const day = format(startOfDay(new Date(log.logged_at)), 'yyyy-MM-dd');
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + log.reps);
  }
  return dailyTotals;
}

export function calculateStreak(logs: PushupLog[], goal: number = DAILY_GOAL): number {
  const today = startOfDay(new Date());
  const dailyTotals = buildDailyTotals(logs);

  let checkDate = today;
  const todayKey = format(today, 'yyyy-MM-dd');
  if ((dailyTotals.get(todayKey) ?? 0) < goal) {
    checkDate = subDays(today, 1);
  }

  let streak = 0;
  while (true) {
    const dateKey = format(checkDate, 'yyyy-MM-dd');
    if ((dailyTotals.get(dateKey) ?? 0) >= goal) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calculateRecords(logs: PushupLog[], goal: number = DAILY_GOAL): Records {
  if (logs.length === 0) {
    return { bestSet: 0, longestStreak: 0, mostInDay: 0 };
  }

  const bestSet = Math.max(...logs.map(l => l.reps));
  const dailyTotals = buildDailyTotals(logs);
  const mostInDay = Math.max(...Array.from(dailyTotals.values()));

  const completedDays = Array.from(dailyTotals.entries())
    .filter(([, total]) => total >= goal)
    .map(([date]) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());

  let longestStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < completedDays.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const diff = differenceInCalendarDays(completedDays[i], completedDays[i - 1]);
      currentStreak = diff === 1 ? currentStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return { bestSet, longestStreak, mostInDay };
}

export function getChartData(logs: PushupLog[], days: number, goal: number = DAILY_GOAL): ChartDay[] {
  const today = new Date();
  const start = subDays(today, days - 1);
  return eachDayOfInterval({ start, end: today }).map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const total = logs
      .filter(log => {
        const d = new Date(log.logged_at);
        return d >= dayStart && d <= dayEnd;
      })
      .reduce((sum, log) => sum + log.reps, 0);
    return {
      date: format(day, days <= 7 ? 'EEE' : 'd'),
      fullDate: format(day, 'MMM d'),
      total,
      goal,
    };
  });
}

export function calculateVariationStats(logs: PushupLog[]): VariationStats[] {
  const statsMap = new Map<string, { totalReps: number; bestSet: number; setCount: number }>();
  for (const log of logs) {
    const variation = log.variation ?? 'Standard';
    const existing = statsMap.get(variation) ?? { totalReps: 0, bestSet: 0, setCount: 0 };
    statsMap.set(variation, {
      totalReps: existing.totalReps + log.reps,
      bestSet: Math.max(existing.bestSet, log.reps),
      setCount: existing.setCount + 1,
    });
  }
  return Array.from(statsMap.entries())
    .map(([variation, stats]) => ({ variation, ...stats }))
    .sort((a, b) => b.totalReps - a.totalReps);
}
