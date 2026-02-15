import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TrendDay {
    reps: bigint;
    dayStart: Time;
}
export type DailyGoal = bigint;
export type Time = bigint;
export interface DayStats {
    reps: bigint;
    sets: bigint;
}
export interface UserStats {
    dailyTrends: Array<TrendDay>;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDayStats(dayStamp: bigint): Promise<DayStats | null>;
    getDayStatsForUser(user: Principal, dayStamp: bigint): Promise<DayStats | null>;
    getDayTotal(dayStamp: bigint): Promise<bigint | null>;
    getDayTotalForUser(user: Principal, dayStamp: bigint): Promise<bigint | null>;
    getTodayGoal(arg0: null): Promise<DailyGoal | null>;
    getTodayStats(arg0: null): Promise<DayStats | null>;
    getTodayTotal(arg0: null): Promise<bigint | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserStats(): Promise<UserStats>;
    hasEntriesToday(arg0: null): Promise<boolean>;
    incrementTodayTotal(reps: bigint): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setTodayGoal(goal: DailyGoal): Promise<void>;
}
