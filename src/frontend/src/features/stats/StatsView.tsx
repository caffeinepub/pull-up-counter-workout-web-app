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
      
      // Only set displayStats if fetched and no error
      if (todayStatsFetched && !todayStatsError) {
        displayStats = backendTodayStats 
          ? { reps: Number(backendTodayStats.reps), sets: Number(backendTodayStats.sets) }
          : { reps: 0, sets: 0 };
      }
      
      // Only set displayGoal if fetched and no error
      if (goalFetched && !goalError) {
        displayGoal = backendGoalData ? Number(backendGoalData) : null;
      }
    } else {
      isLoadingStats = dayStatsLoading;
      hasStatsError = dayStatsError;
      
      // Only set displayStats if fetched and no error
      if (dayStatsFetched && !dayStatsError) {
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl">
            {isToday ? "Today's Statistics" : `Statistics for ${selectedDate}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingStats ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading statistics...</p>
            </div>
          ) : hasStatsError || (isToday && hasGoalError) ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive">
                  {hasStatsError 
                    ? 'Failed to load statistics. Please try again.'
                    : 'Failed to load daily goal. Please try again.'}
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
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-4xl font-bold text-primary">{displayStats.reps}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Reps</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-4xl font-bold text-primary">{displayStats.sets}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Sets</p>
                </div>
              </div>

              {/* Average Reps per Set */}
              {displayStats.sets > 0 && (
                <div className="text-center p-4 bg-secondary/10 rounded-lg">
                  <div className="text-3xl font-bold text-secondary">
                    {(displayStats.reps / displayStats.sets).toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Average Reps per Set</p>
                </div>
              )}

              {/* Goal Progress - Only for today */}
              {isToday && displayGoal !== null && displayGoal > 0 && (
                <div className="space-y-3 p-4 bg-accent/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-accent" />
                      <span className="font-medium">Daily Goal</span>
                    </div>
                    <span className="text-sm font-medium">{displayGoal} reps</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  {progressPercentage >= 100 && (
                    <div className="flex items-center justify-center gap-2 text-primary font-medium">
                      <CheckCircle className="w-5 h-5" />
                      <span>Goal achieved!</span>
                    </div>
                  )}
                </div>
              )}

              {/* No data message */}
              {displayStats.reps === 0 && displayStats.sets === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No workout data for this date.</p>
                  {isToday && <p className="text-sm mt-2">Start logging sets to see your stats!</p>}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Unable to load statistics.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guest Mode Notice */}
      {!isAuthenticated && (
        <Card className="border-2 border-muted">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Guest Mode</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to view historical statistics and track your progress over time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
