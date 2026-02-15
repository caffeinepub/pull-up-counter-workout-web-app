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
 */
export function dateStringToDayStamp(dateString: string): bigint {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return dateToDayStamp(date);
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
