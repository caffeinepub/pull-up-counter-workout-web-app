import { useState, useEffect, useRef } from 'react';
import { getLocalDayKey } from '../../utils/dayStamp';

const STORAGE_KEY = 'pullup_daily_goal';

interface DailyGoalData {
  date: string;
  goal: number;
}

function loadDailyGoal(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data: DailyGoalData = JSON.parse(stored);
    const today = getLocalDayKey();

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
    date: getLocalDayKey(),
    goal,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useLocalDailyGoal() {
  const [dailyGoal, setDailyGoal] = useState<number | null>(loadDailyGoal);
  const lastCheckedDayRef = useRef<string>(getLocalDayKey());

  useEffect(() => {
    // Load initial state
    const loaded = loadDailyGoal();
    setDailyGoal(loaded);

    // Check for date rollover periodically (stable interval, not recreated on state change)
    const interval = setInterval(() => {
      const currentDay = getLocalDayKey();
      if (currentDay !== lastCheckedDayRef.current) {
        // Day has changed, reload goal (will be null for new day)
        lastCheckedDayRef.current = currentDay;
        const newGoal = loadDailyGoal();
        setDailyGoal(newGoal);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []); // Empty deps - interval is stable

  const setGoal = (goal: number | null) => {
    setDailyGoal(goal);
    saveDailyGoal(goal);
  };

  return {
    dailyGoal,
    setGoal,
  };
}
