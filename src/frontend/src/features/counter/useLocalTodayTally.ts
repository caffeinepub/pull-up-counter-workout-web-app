import { useState, useEffect, useRef } from 'react';
import { getLocalDayKey } from '../../utils/dayStamp';

const STORAGE_KEY = 'pullup_today_tally';

interface TodayTallyData {
  date: string;
  reps: number;
  sets: number;
}

function loadTodayTally(): { reps: number; sets: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { reps: 0, sets: 0 };

    const data: TodayTallyData = JSON.parse(stored);
    const today = getLocalDayKey();

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
    date: getLocalDayKey(),
    reps,
    sets,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useLocalTodayTally() {
  const [todayStats, setTodayStats] = useState<{ reps: number; sets: number }>(loadTodayTally);
  const lastCheckedDayRef = useRef<string>(getLocalDayKey());

  useEffect(() => {
    // Load initial state
    const loaded = loadTodayTally();
    setTodayStats(loaded);

    // Check for date rollover periodically (stable interval, not recreated on state change)
    const interval = setInterval(() => {
      const currentDay = getLocalDayKey();
      if (currentDay !== lastCheckedDayRef.current) {
        // Day has changed, reload stats (will be 0 for new day)
        lastCheckedDayRef.current = currentDay;
        const newStats = loadTodayTally();
        setTodayStats(newStats);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []); // Empty deps - interval is stable

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
