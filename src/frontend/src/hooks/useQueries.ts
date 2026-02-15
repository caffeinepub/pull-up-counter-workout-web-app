import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, DayStats, DailyGoal } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetTodayTotal() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<bigint | null>({
    queryKey: ['todayTotal'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTodayTotal(null);
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetTodayStats() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<DayStats | null>({
    queryKey: ['todayStats'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTodayStats(null);
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetDayStats(dayStamp: bigint | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<DayStats | null>({
    queryKey: ['dayStats', dayStamp?.toString()],
    queryFn: async () => {
      if (!actor || dayStamp === null) throw new Error('Actor or dayStamp not available');
      return actor.getDayStats(dayStamp);
    },
    enabled: !!actor && !isFetching && isAuthenticated && dayStamp !== null,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetTodayGoal() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<DailyGoal | null>({
    queryKey: ['todayGoal'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTodayGoal(null);
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useSetTodayGoal() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: number) => {
      if (!actor || !identity) throw new Error('Must be authenticated');
      return actor.setTodayGoal(BigInt(goal));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayGoal'] });
    },
  });
}

export function useIncrementTodayTotal() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reps: number) => {
      if (!actor || !identity) throw new Error('Must be authenticated');
      return actor.incrementTodayTotal(BigInt(reps));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayTotal'] });
      queryClient.invalidateQueries({ queryKey: ['todayStats'] });
      // Also invalidate day stats queries to update calendar view if today is selected
      queryClient.invalidateQueries({ queryKey: ['dayStats'] });
    },
  });
}
