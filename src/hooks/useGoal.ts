import { useState, useCallback } from 'react';
import { DAILY_GOAL } from '@/lib/constants';

const GOAL_KEY = 'pushup-daily-goal';

export const useGoal = () => {
  const [goal, setGoalState] = useState<number>(() => {
    const stored = localStorage.getItem(GOAL_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DAILY_GOAL;
  });

  const setGoal = useCallback((newGoal: number) => {
    localStorage.setItem(GOAL_KEY, String(newGoal));
    setGoalState(newGoal);
  }, []);

  return { goal, setGoal };
};
