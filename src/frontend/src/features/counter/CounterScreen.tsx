import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIncrementTodayTotal, useGetTodayGoal, useSetTodayGoal, useGetTodayTotal } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, RotateCcw, CheckCircle, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ResetSessionDialog from './ResetSessionDialog';
import ResetTodayDialog from './ResetTodayDialog';
import { useLocalTodayTally } from './useLocalTodayTally';
import { useLocalDailyGoal } from './useLocalDailyGoal';

export default function CounterScreen() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const [reps, setReps] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showResetTodayDialog, setShowResetTodayDialog] = useState(false);

  const incrementTodayTotal = useIncrementTodayTotal();
  const { todayReps: localTodayReps, addSet: addLocalSet, resetToday: resetLocalToday } = useLocalTodayTally();
  
  // Fetch authenticated user's today total
  const { 
    data: backendTodayTotal, 
    isLoading: todayTotalLoading, 
    isFetched: todayTotalFetched,
    isError: todayTotalError,
    refetch: refetchTodayTotal
  } = useGetTodayTotal();
  
  // Local goal for unauthenticated users
  const { dailyGoal: localDailyGoal, setGoal: setLocalGoal } = useLocalDailyGoal();
  
  // Backend goal for authenticated users
  const { 
    data: backendGoalData, 
    isLoading: goalLoading, 
    isFetched: goalFetched,
    isError: goalQueryError,
    refetch: refetchGoal
  } = useGetTodayGoal();
  const setBackendGoal = useSetTodayGoal();

  // Determine which goal to use - only use backend data if fetched and not in error
  const dailyGoal = isAuthenticated 
    ? (goalFetched && !goalQueryError ? (backendGoalData ? Number(backendGoalData) : null) : null)
    : localDailyGoal;

  // Draft state for goal input (not yet confirmed)
  const [goalDraft, setGoalDraft] = useState<string>('');
  const [goalValidationError, setGoalValidationError] = useState<string>('');

  // Sync goalDraft with dailyGoal when it changes and is loaded
  useEffect(() => {
    if (!isAuthenticated || (goalFetched && !goalQueryError)) {
      setGoalDraft(dailyGoal !== null ? String(dailyGoal) : '');
      setGoalValidationError('');
    }
  }, [dailyGoal, isAuthenticated, goalFetched, goalQueryError]);

  const incrementRepsCount = () => setReps((prev) => prev + 1);
  const decrementRepsCount = () => setReps((prev) => Math.max(0, prev - 1));

  const handleReset = () => {
    setReps(0);
    setShowResetDialog(false);
    toast.success('Set reset');
  };

  const handleResetToday = async () => {
    if (isAuthenticated) {
      toast.error('Reset today is not available for authenticated users. Contact support if needed.');
    } else {
      resetLocalToday();
      toast.success('Today\'s total reset');
    }
    setShowResetTodayDialog(false);
  };

  const handleLogSet = async () => {
    if (reps === 0) {
      toast.error('Cannot log a set with 0 reps');
      return;
    }

    if (isAuthenticated) {
      try {
        await incrementTodayTotal.mutateAsync(reps);
        toast.success(`Set logged! +${reps} reps added to today's total`);
        setReps(0);
      } catch (error) {
        toast.error('Failed to log set');
        console.error(error);
      }
    } else {
      addLocalSet(reps);
      toast.success(`Set logged! +${reps} reps added to today's total`);
      setReps(0);
    }
  };

  const handleGoalChange = (value: string) => {
    setGoalDraft(value);
    setGoalValidationError('');
  };

  const handleConfirmGoal = async () => {
    const parsedGoal = goalDraft === '' ? null : parseInt(goalDraft, 10);
    
    if (parsedGoal !== null && (isNaN(parsedGoal) || parsedGoal < 0)) {
      setGoalValidationError('Please enter a valid positive number');
      return;
    }

    if (isAuthenticated) {
      if (parsedGoal !== null) {
        try {
          await setBackendGoal.mutateAsync(parsedGoal);
          toast.success('Daily goal updated');
        } catch (error) {
          toast.error('Failed to update goal');
          console.error(error);
        }
      }
    } else {
      setLocalGoal(parsedGoal);
      if (parsedGoal !== null) {
        toast.success('Daily goal updated');
      }
    }
  };

  const handleClearGoal = async () => {
    if (isAuthenticated) {
      try {
        await setBackendGoal.mutateAsync(0);
        setGoalDraft('');
        toast.success('Daily goal cleared');
      } catch (error) {
        toast.error('Failed to clear goal');
        console.error(error);
      }
    } else {
      setLocalGoal(null);
      setGoalDraft('');
      toast.success('Daily goal cleared');
    }
  };

  // Calculate today's total reps for progress - only use backend data if fetched and not in error
  const todayTotalReps = isAuthenticated 
    ? (todayTotalFetched && !todayTotalError ? (backendTodayTotal ? Number(backendTodayTotal) : 0) : 0)
    : localTodayReps;
  
  const progressPercentage = dailyGoal && dailyGoal > 0 ? Math.min((todayTotalReps / dailyGoal) * 100, 100) : 0;

  // Check if goal draft is different from current goal
  const isDraftChanged = goalDraft !== (dailyGoal !== null ? String(dailyGoal) : '');
  const isConfirmDisabled = !isDraftChanged || setBackendGoal.isPending;

  // Show loading state for authenticated users while data is loading
  const isLoadingData = isAuthenticated && (todayTotalLoading || goalLoading);

  // Determine if we should show error UI or normal UI
  const showTodayTotalError = isAuthenticated && todayTotalError;
  const showGoalError = isAuthenticated && goalQueryError;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Counter Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Current Set</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Rep Counter */}
          <div className="text-center space-y-4">
            <div className="text-8xl font-bold tracking-tighter text-primary">
              {reps}
            </div>
            <p className="text-muted-foreground text-lg">Pull-ups</p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={decrementRepsCount}
              disabled={reps === 0}
              className="w-20 h-20 rounded-full"
            >
              <Minus className="w-8 h-8" />
            </Button>
            <Button
              size="lg"
              onClick={incrementRepsCount}
              className="w-20 h-20 rounded-full"
            >
              <Plus className="w-8 h-8" />
            </Button>
          </div>

          {/* Log Set Button */}
          {reps > 0 && (
            <Button
              onClick={handleLogSet}
              size="lg"
              variant="secondary"
              className="w-full"
              disabled={incrementTodayTotal.isPending}
            >
              {incrementTodayTotal.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Log Set
                </>
              )}
            </Button>
          )}

          {/* Reset Set Button */}
          {reps > 0 && (
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Set
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Today's Total Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-center text-xl">Today's Total</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your stats...</p>
            </div>
          ) : showTodayTotalError ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive">
                  Failed to load today's total. Please try again.
                </p>
              </div>
              <Button
                onClick={() => refetchTodayTotal()}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className="text-6xl font-bold tracking-tighter text-primary">
                  {todayTotalReps}
                </div>
                <p className="text-muted-foreground text-sm mt-2">Total Pull-ups</p>
              </div>

              {dailyGoal !== null && dailyGoal > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Goal Progress</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  {progressPercentage >= 100 && (
                    <p className="text-sm text-primary font-medium text-center">
                      🎉 Goal achieved!
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {!isAuthenticated && (
            <Button
              onClick={() => setShowResetTodayDialog(true)}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Today's Total
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Daily Goal Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading goal...</p>
            </div>
          ) : showGoalError ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-destructive">
                  Failed to load daily goal. Please try again.
                </p>
              </div>
              <Button
                onClick={() => refetchGoal()}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="goal-input">Set your daily pull-up goal</Label>
                <div className="flex gap-2">
                  <Input
                    id="goal-input"
                    type="number"
                    min="0"
                    placeholder="Enter goal"
                    value={goalDraft}
                    onChange={(e) => handleGoalChange(e.target.value)}
                    className={goalValidationError ? 'border-destructive' : ''}
                  />
                  <Button
                    onClick={handleConfirmGoal}
                    disabled={isConfirmDisabled}
                    size="icon"
                    variant="secondary"
                  >
                    {setBackendGoal.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {goalValidationError && (
                  <p className="text-sm text-destructive">{goalValidationError}</p>
                )}
              </div>

              {dailyGoal !== null && dailyGoal > 0 && (
                <Button
                  onClick={handleClearGoal}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  disabled={setBackendGoal.isPending}
                >
                  Clear Goal
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ResetSessionDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleReset}
      />

      <ResetTodayDialog
        open={showResetTodayDialog}
        onOpenChange={setShowResetTodayDialog}
        onConfirm={handleResetToday}
      />
    </div>
  );
}
