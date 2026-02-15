import { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetTodayStats, useGetTodayGoal, useGetDayStats } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Target, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useLocalTodayTally } from '../counter/useLocalTodayTally';
import { useLocalDailyGoal } from '../counter/useLocalDailyGoal';
import { getTodayDateString, dateStringToDayStamp } from '../../utils/dayStamp';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
    isError: todayStatsError 
  } = useGetTodayStats();
  
  const { 
    data: backendDayStats, 
    isLoading: dayStatsLoading, 
    isError: dayStatsError 
  } = useGetDayStats(selectedDayStamp);
  
  const { 
    data: backendGoalData, 
    isLoading: goalLoading, 
    isError: goalError 
  } = useGetTodayGoal();
  
  const { todayReps: localTodayReps, todaySets: localTodaySets } = useLocalTodayTally();
  const { dailyGoal: localDailyGoal } = useLocalDailyGoal();

  // Determine loading and error states
  const isLoadingStats = isAuthenticated && (isToday ? todayStatsLoading : dayStatsLoading);
  const hasStatsError = isAuthenticated && (isToday ? todayStatsError : dayStatsError);
  const isLoadingGoal = isAuthenticated && goalLoading;

  // Use appropriate stats based on authentication and date selection
  let displayReps: number;
  let displaySets: number;

  if (isAuthenticated) {
    if (isToday) {
      // For today, use today stats
      displayReps = backendTodayStats ? Number(backendTodayStats.reps) : 0;
      displaySets = backendTodayStats ? Number(backendTodayStats.sets) : 0;
    } else {
      // For other days, use day stats
      displayReps = backendDayStats ? Number(backendDayStats.reps) : 0;
      displaySets = backendDayStats ? Number(backendDayStats.sets) : 0;
    }
  } else {
    // Unauthenticated users can only see today's local stats
    displayReps = localTodayReps;
    displaySets = localTodaySets;
  }

  const dailyGoal = isAuthenticated
    ? (backendGoalData ? Number(backendGoalData) : null)
    : localDailyGoal;

  const averageRepsPerSet = displaySets > 0 ? (displayReps / displaySets).toFixed(1) : '—';
  const goalProgress = dailyGoal && dailyGoal > 0 && isToday ? Math.min((displayReps / dailyGoal) * 100, 100) : null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Get max date (today)
  const maxDate = getTodayDateString();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Date Selector for Authenticated Users */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="date-select">View stats for:</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={maxDate}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            {isToday ? "Today's Stats" : `Stats for ${selectedDate}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : hasStatsError ? (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-destructive">
                Failed to load stats. Please try again.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-4xl font-bold tracking-tighter text-primary">
                    {displayReps}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">Total Reps</p>
                </div>
                <div>
                  <div className="text-4xl font-bold tracking-tighter text-primary">
                    {displaySets}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">Sets Logged</p>
                </div>
                <div>
                  <div className="text-4xl font-bold tracking-tighter text-primary">
                    {averageRepsPerSet}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">Avg Reps/Set</p>
                </div>
              </div>
              
              {displayReps === 0 && displaySets === 0 && !isToday && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    No data for this day
                  </p>
                </div>
              )}

              {!isAuthenticated && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">
                    Sign in to sync your daily stats across devices and view historical data
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Daily Goal Progress Card - Only show for today */}
      {isToday && dailyGoal !== null && dailyGoal > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Daily Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingGoal || isLoadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold text-primary">{displayReps}</span>
                  <span className="text-muted-foreground">/ {dailyGoal} reps</span>
                </div>
                <Progress value={goalProgress ?? 0} className="h-3" />
                {goalProgress !== null && goalProgress >= 100 && (
                  <p className="text-sm text-primary font-medium">🎉 Goal achieved!</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
