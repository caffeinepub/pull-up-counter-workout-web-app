# Specification

## Summary
**Goal:** Prevent “today” stats and daily goal from unexpectedly resetting by making day tracking timezone-safe, ensuring consistent authenticated/unauthenticated persistence, and persisting backend state across canister upgrades.

**Planned changes:**
- Identify and fix the root cause(s) of unexpected stat resets in both local-only (unauthenticated) and backend-synced (authenticated) modes.
- Update local-only persistence to use a stable local-day identifier so “today” stats and daily goal only roll over when the user’s local date changes.
- Make authenticated day-based stats timezone-safe by using a single consistent “day identifier” approach shared between frontend and backend, so Counter and Stats screens agree on “today.”
- Persist backend state for user profiles, per-day stats, and daily goals across canister upgrades using stable storage and upgrade hooks (adding a migration module only if required to preserve existing deployed data).
- Adjust React Query cache/refetch handling so loading/refetch/error states are not shown as real “0” stats and errors surface appropriately instead of looking like resets.

**User-visible outcome:** Logged reps/sets and daily goals reliably persist across refreshes and over time, “today” no longer resets mid-day due to timezone mismatches, Counter and Stats screens stay in sync for authenticated users, and authenticated data survives deployments/upgrades without loss.
