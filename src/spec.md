# Specification

## Summary
**Goal:** Fix persistence and rehydration so Today totals/sets and daily goal reliably survive refresh, browser restart, and backend upgrades, without briefly showing “reset” values during authenticated load.

**Planned changes:**
- Diagnose and correct guest-mode persistence so per-local-day Today totals/sets and daily goal are saved to and restored from local storage on app load/refresh/reopen.
- Adjust authenticated-mode frontend state handling to avoid rendering 0/null as real values while identity and backend queries are still loading; show explicit loading and clear error states with a retry path.
- Update the Motoko canister to persist required authenticated user state across upgrades using stable storage and upgrade hooks (profiles, per-user per-day totals/stats, and per-user daily goals).

**User-visible outcome:** Guest users keep their current-day Today totals/sets and daily goal after refresh or reopening the browser, and signed-in users see their saved totals/goals reliably reappear after refresh (with proper loading/error UI) and remain intact across canister upgrades.
