import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pullup_daily_goal';

interface DailyGoalData {
  date: string;
  goal: number;
}

function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

function loadDailyGoal(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: DailyGoalData = JSON.parse(stored);
    const today = getTodayDateKey();

    // Only return goal if it's for today
    if (data.date === today) {
      return data.goal;
    }
    return null;
  } catch {
    return null;
  }
}

function saveDailyGoal(goal: number | null): void {
  if (goal === null) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const data: DailyGoalData = {
    date: getTodayDateKey(),
    goal,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useLocalDailyGoal() {
  const [dailyGoal, setDailyGoal] = useState<number | null>(loadDailyGoal);

  useEffect(() => {
    const loaded = loadDailyGoal();
    setDailyGoal(loaded);

    // Check for date rollover periodically
    const interval = setInterval(() => {
      const current = loadDailyGoal();
      if (current !== dailyGoal) {
        setDailyGoal(current);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [dailyGoal]);

  const setGoal = (goal: number | null) => {
    setDailyGoal(goal);
    saveDailyGoal(goal);
  };

  return {
    dailyGoal,
    setGoal,
  };
}
