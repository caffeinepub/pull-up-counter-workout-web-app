import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIncrementTodayTotal, useGetTodayGoal, useSetTodayGoal, useGetTodayTotal } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, RotateCcw, CheckCircle, Check } from 'lucide-react';
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
  const { data: backendTodayTotal } = useGetTodayTotal();
  
  // Local goal for unauthenticated users
  const { dailyGoal: localDailyGoal, setGoal: setLocalGoal } = useLocalDailyGoal();
  
  // Backend goal for authenticated users
  const { data: backendGoalData } = useGetTodayGoal();
  const setBackendGoal = useSetTodayGoal();

  // Determine which goal to use
  const dailyGoal = isAuthenticated 
    ? (backendGoalData ? Number(backendGoalData) : null)
    : localDailyGoal;

  // Draft state for goal input (not yet confirmed)
  const [goalDraft, setGoalDraft] = useState<string>('');
  const [goalError, setGoalError] = useState<string>('');

  // Sync goalDraft with dailyGoal when it changes
  useEffect(() => {
    setGoalDraft(dailyGoal !== null ? String(dailyGoal) : '');
    setGoalError('');
  }, [dailyGoal]);

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
    setGoalError('');
  };

  const handleConfirmGoal = async () => {
    const parsedGoal = goalDraft === '' ? null : parseInt(goalDraft, 10);
    
    if (parsedGoal !== null && (isNaN(parsedGoal) || parsedGoal < 0)) {
      setGoalError('Please enter a valid positive number');
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

  // Calculate today's total reps for progress
  const todayTotalReps = isAuthenticated 
    ? (backendTodayTotal ? Number(backendTodayTotal) : 0)
    : localTodayReps;
  
  const progressPercentage = dailyGoal && dailyGoal > 0 ? Math.min((todayTotalReps / dailyGoal) * 100, 100) : 0;

  // Check if goal draft is different from current goal
  const isDraftChanged = goalDraft !== (dailyGoal !== null ? String(dailyGoal) : '');
  const isConfirmDisabled = !isDraftChanged || setBackendGoal.isPending;

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
              <CheckCircle className="w-5 h-5 mr-2" />
              {incrementTodayTotal.isPending ? 'Logging...' : 'Log Set'}
            </Button>
          )}

          {/* Reset Set Button */}
          {reps > 0 && (
            <Button
              onClick={() => setShowResetDialog(true)}
              size="lg"
              variant="outline"
              className="w-full"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset Set
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Daily Goal Setting */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Goal (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <Label htmlFor="goal">Target Reps for Today</Label>
              <Input
                id="goal"
                type="number"
                min="0"
                placeholder="e.g., 100"
                value={goalDraft}
                onChange={(e) => handleGoalChange(e.target.value)}
                className={goalError ? 'border-destructive' : ''}
              />
              {goalError && (
                <p className="text-sm text-destructive">{goalError}</p>
              )}
            </div>
            <div className="flex gap-2 pt-8">
              <Button
                variant="default"
                onClick={handleConfirmGoal}
                disabled={isConfirmDisabled}
                className="min-w-[100px]"
              >
                {setBackendGoal.isPending ? (
                  'Saving...'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </>
                )}
              </Button>
              {dailyGoal !== null && dailyGoal > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearGoal}
                  disabled={setBackendGoal.isPending}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Daily Goal Progress */}
          {dailyGoal !== null && dailyGoal > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Today's Progress</span>
                <span>
                  {todayTotalReps} / {dailyGoal}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Today Button for Unauthenticated Users */}
      {!isAuthenticated && localTodayReps > 0 && (
        <Card>
          <CardContent className="py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetTodayDialog(true)}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Today's Total
            </Button>
          </CardContent>
        </Card>
      )}

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
