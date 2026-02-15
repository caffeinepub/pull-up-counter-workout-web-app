/**
 * Utility functions for converting between dates and day stamps.
 * Day stamps are bigint identifiers used by the backend to identify days.
 */

const DAYS_IN_MICROS = 60 * 1000000 * 60 * 24;

/**
 * Convert a Date object to a day stamp (bigint identifier)
 */
export function dateToDayStamp(date: Date): bigint {
  const micros = BigInt(date.getTime()) * BigInt(1000);
  return BigInt(Math.abs(Number(micros / BigInt(DAYS_IN_MICROS)))) % BigInt(1000000);
}

/**
 * Get the day stamp for today
 */
export function getTodayDayStamp(): bigint {
  return dateToDayStamp(new Date());
}

/**
 * Convert a YYYY-MM-DD string to a day stamp
 * Uses local timezone interpretation (treats the string as local date at midnight)
 */
export function dateStringToDayStamp(dateString: string): bigint {
  // Parse as local date by using Date constructor without timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return dateToDayStamp(date);
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a local-day key for persistence (YYYY-MM-DD in local timezone)
 * This is the single source of truth for local-only storage keys
 */
export function getLocalDayKey(): string {
  return getTodayDateString();
}
