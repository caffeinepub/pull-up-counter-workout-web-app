# Specification

## Summary
**Goal:** Fix Counter daily goal progress for authenticated users, require explicit confirmation when changing the daily target, and add a date selector on Stats to view prior days.

**Planned changes:**
- Fix Counter “Today’s Progress” to use the signed-in user’s backend “Today reps” total (and keep local tracking when signed out).
- Ensure Counter goal progress updates immediately after logging a set (numerator and progress bar) without a full refresh.
- Change daily target editing to only persist when the user clicks a new “Confirm” button; validate input and keep existing Clear behavior.
- Add a Stats date selector showing the currently selected date; when signed in, fetch and display stats for that selected day (including prior days).
- Extend/add React Query + backend support to fetch stats for an arbitrary selected day with date-based query keys and correct caching.

**User-visible outcome:** Signed-in users see accurate daily goal progress on the Counter that updates as they log sets, can change their daily target only after confirming, and can pick a date on the Stats screen to view that day’s stats (including prior days).
