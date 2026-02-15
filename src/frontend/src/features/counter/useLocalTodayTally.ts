import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pullup_today_tally';

interface TodayTallyData {
  date: string;
  reps: number;
  sets: number;
}

function getTodayDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

function loadTodayTally(): { reps: number; sets: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { reps: 0, sets: 0 };

    const data: TodayTallyData = JSON.parse(stored);
    const today = getTodayDateKey();

    if (data.date === today) {
      return { reps: data.reps, sets: data.sets };
    }
    return { reps: 0, sets: 0 };
  } catch {
    return { reps: 0, sets: 0 };
  }
}

function saveTodayTally(reps: number, sets: number): void {
  const data: TodayTallyData = {
    date: getTodayDateKey(),
    reps,
    sets,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useLocalTodayTally() {
  const [todayStats, setTodayStats] = useState<{ reps: number; sets: number }>(loadTodayTally);

  useEffect(() => {
    const loaded = loadTodayTally();
    setTodayStats(loaded);

    // Check for date rollover periodically
    const interval = setInterval(() => {
      const current = loadTodayTally();
      if (current.reps !== todayStats.reps || current.sets !== todayStats.sets) {
        setTodayStats(current);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [todayStats.reps, todayStats.sets]);

  const addSet = (reps: number) => {
    const newReps = todayStats.reps + reps;
    const newSets = todayStats.sets + 1;
    setTodayStats({ reps: newReps, sets: newSets });
    saveTodayTally(newReps, newSets);
  };

  const resetToday = () => {
    setTodayStats({ reps: 0, sets: 0 });
    saveTodayTally(0, 0);
  };

  return {
    todayReps: todayStats.reps,
    todaySets: todayStats.sets,
    addSet,
    resetToday,
  };
}
