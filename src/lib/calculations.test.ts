import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateStreak, calculateRecords, buildDailyTotals, getChartData } from './calculations';
import type { PushupLog } from './calculations';

const GOAL = 100;

function makeLog(daysAgo: number, reps: number, id = Math.random().toString()): PushupLog {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return {
    id,
    user_id: 'u1',
    reps,
    logged_at: d.toISOString(),
    created_at: d.toISOString(),
    variation: null,
  };
}

describe('buildDailyTotals', () => {
  it('sums reps for the same day', () => {
    const logs = [makeLog(0, 40, '1'), makeLog(0, 60, '2')];
    const totals = buildDailyTotals(logs);
    expect(totals.size).toBe(1);
    expect([...totals.values()][0]).toBe(100);
  });

  it('keeps separate days separate', () => {
    const logs = [makeLog(0, 50), makeLog(1, 50)];
    expect(buildDailyTotals(logs).size).toBe(2);
  });
});

describe('calculateStreak', () => {
  it('returns 0 for empty logs', () => {
    expect(calculateStreak([], GOAL)).toBe(0);
  });

  it('returns 0 when today is incomplete and no prior days', () => {
    expect(calculateStreak([makeLog(0, 50)], GOAL)).toBe(0);
  });

  it('counts a streak when today is complete', () => {
    const logs = [makeLog(0, 100)];
    expect(calculateStreak(logs, GOAL)).toBe(1);
  });

  it('counts consecutive completed days', () => {
    const logs = [
      makeLog(0, 100),
      makeLog(1, 100),
      makeLog(2, 100),
    ];
    expect(calculateStreak(logs, GOAL)).toBe(3);
  });

  it('breaks streak on a missed day', () => {
    const logs = [
      makeLog(0, 100),
      makeLog(2, 100), // day 1 is missing
    ];
    expect(calculateStreak(logs, GOAL)).toBe(1);
  });

  it('falls back to yesterday when today is incomplete', () => {
    const logs = [
      makeLog(0, 50),  // today: incomplete
      makeLog(1, 100), // yesterday: complete
      makeLog(2, 100),
    ];
    expect(calculateStreak(logs, GOAL)).toBe(2);
  });

  it('respects a custom goal', () => {
    const logs = [makeLog(0, 50)];
    expect(calculateStreak(logs, 50)).toBe(1);
    expect(calculateStreak(logs, 100)).toBe(0);
  });

  it('accumulates multiple sets in one day', () => {
    const logs = [makeLog(0, 40, '1'), makeLog(0, 40, '2'), makeLog(0, 25, '3')];
    expect(calculateStreak(logs, GOAL)).toBe(1);
  });
});

describe('calculateRecords', () => {
  it('returns zeros for empty logs', () => {
    expect(calculateRecords([], GOAL)).toEqual({ bestSet: 0, longestStreak: 0, mostInDay: 0 });
  });

  it('finds best single set', () => {
    const logs = [makeLog(0, 30), makeLog(0, 75), makeLog(1, 50)];
    expect(calculateRecords(logs, GOAL).bestSet).toBe(75);
  });

  it('finds most in a day', () => {
    const logs = [makeLog(0, 60, '1'), makeLog(0, 60, '2'), makeLog(1, 80)];
    expect(calculateRecords(logs, GOAL).mostInDay).toBe(120);
  });

  it('calculates longest streak correctly', () => {
    const logs = [
      makeLog(0, 100),
      makeLog(1, 100),
      makeLog(2, 100),
      makeLog(4, 100), // streak breaks at day 3
      makeLog(5, 100),
    ];
    expect(calculateRecords(logs, GOAL).longestStreak).toBe(3);
  });

  it('longest streak of 1 when no consecutive days', () => {
    const logs = [makeLog(0, 100), makeLog(2, 100), makeLog(4, 100)];
    expect(calculateRecords(logs, GOAL).longestStreak).toBe(1);
  });
});

describe('getChartData', () => {
  it('returns correct number of days', () => {
    expect(getChartData([], 7, GOAL)).toHaveLength(7);
    expect(getChartData([], 30, GOAL)).toHaveLength(30);
  });

  it('correctly totals reps for a day', () => {
    const logs = [makeLog(0, 40, '1'), makeLog(0, 60, '2')];
    const data = getChartData(logs, 7, GOAL);
    const today = data[data.length - 1];
    expect(today.total).toBe(100);
  });

  it('sets goal on each entry', () => {
    const data = getChartData([], 7, 150);
    data.forEach(d => expect(d.goal).toBe(150));
  });
});
