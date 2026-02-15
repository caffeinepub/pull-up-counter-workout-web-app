import { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetTodayStats, useGetTodayGoal, useGetDayStats } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Target, Calendar as CalendarIcon, Loader2, RotateCcw } from 'lucide-react';
import { useLocalTodayTally } from '../counter/useLocalTodayTally';
import { useLocalDailyGoal } from '../counter/useLocalDailyGoal';
import { getTodayDateString, dateStringToDayStamp } from '../../utils/dayStamp';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function StatsView() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const selectedDayStamp = isAuthenticated ? dateStringToDayStamp(selectedDate) : null;
  const isToday = selectedDate === getTodayDateString();

  // Fetch stats based on selected date
  const { 
    data: backendTodayStats, 
    isLoading: todayStatsLoading, 
    isFetched: todayStatsFetched,
    isError: todayStatsError,
    refetch: refetchTodayStats
  } = useGetTodayStats();
  
  const { 
    data: backendDayStats, 
    isLoading: dayStatsLoading, 
    isFetched: dayStatsFetched,
    isError: dayStatsError,
    refetch: refetchDayStats
  } = useGetDayStats(selectedDayStamp);
  
  const { 
    data: backendGoalData, 
    isLoading: goalLoading, 
    isFetched: goalFetched,
    isError: goalError,
    refetch: refetchGoal
  } = useGetTodayGoal();

  // Local stats for unauthenticated users
  const { todayReps: localTodayReps, todaySets: localTodaySets } = useLocalTodayTally();
  const { dailyGoal: localDailyGoal } = useLocalDailyGoal();

  // Determine which stats to display based on authentication and selected date
  let displayStats: { reps: number; sets: number } | null = null;
  let displayGoal: number | null = null;
  let isLoadingStats = false;
  let hasStatsError = false;
  let hasGoalError = false;

  if (isAuthenticated) {
    if (isToday) {
      isLoadingStats = todayStatsLoading || goalLoading;
      hasStatsError = todayStatsError;
      hasGoalError = goalError;
      
      if (todayStatsFetched) {
        displayStats = backendTodayStats 
          ? { reps: Number(backendTodayStats.reps), sets: Number(backendTodayStats.sets) }
          : { reps: 0, sets: 0 };
      }
      
      if (goalFetched) {
        displayGoal = backendGoalData ? Number(backendGoalData) : null;
      }
    } else {
      isLoadingStats = dayStatsLoading;
      hasStatsError = dayStatsError;
      
      if (dayStatsFetched) {
        displayStats = backendDayStats 
          ? { reps: Number(backendDayStats.reps), sets: Number(backendDayStats.sets) }
          : { reps: 0, sets: 0 };
      }
      
      // No goal for past dates
      displayGoal = null;
    }
  } else {
    // Guest mode - only show today's stats
    if (isToday) {
      displayStats = { reps: localTodayReps, sets: localTodaySets };
      displayGoal = localDailyGoal;
    } else {
      displayStats = { reps: 0, sets: 0 };
      displayGoal = null;
    }
  }

  const progressPercentage = displayGoal && displayGoal > 0 && displayStats
    ? Math.min((displayStats.reps / displayGoal) * 100, 100)
    : 0;

  const handleRetry = () => {
    if (isToday) {
      refetchTodayStats();
      refetchGoal();
    } else {
      refetchDayStats();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Date Selector - Only for authenticated users */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="date-input">View stats for a specific date</Label>
              <Input
                id="date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getTodayDateString()}
              />
              {!isToday && (
                <p className="text-sm text-muted-foreground">
                  Viewing historical data for {selectedDate}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {isToday ? "Today's Statistics" : `Statistics for ${selectedDate}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingStats ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading statistics...</p>
            </div>
          ) : hasStatsError ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive">
                  Failed to load statistics. Please try again.
                </p>
              </div>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : displayStats ? (
            <>
              {/* Total Reps */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Pull-ups</p>
                <div className="text-6xl font-bold tracking-tighter text-primary">
                  {displayStats.reps}
                </div>
              </div>

              {/* Sets Count */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Sets Completed</p>
                <div className="text-4xl font-bold tracking-tighter">
                  {displayStats.sets}
                </div>
              </div>

              {/* Goal Progress - Only for today */}
              {isToday && displayGoal !== null && displayGoal > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      <span className="font-medium">Daily Goal</span>
                    </div>
                    <span className="text-2xl font-bold">{displayGoal}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                  </div>
                  {progressPercentage >= 100 && (
                    <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <p className="text-sm font-medium text-primary">
                        Goal achieved! Great work! 🎉
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* No goal set message */}
              {isToday && (displayGoal === null || displayGoal === 0) && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <Target className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    No daily goal set. Set a goal in the Counter tab to track your progress!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card for Guest Users */}
      {!isAuthenticated && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Sign in to unlock more features</p>
                <p className="text-sm text-muted-foreground">
                  Track your progress over time, view historical data, and access your stats from any device.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
