# Specification

## Summary
**Goal:** Ensure authenticated user data persists across canister upgrades/deployments and surface backend errors in the UI instead of showing misleading zero values.

**Planned changes:**
- Add `preupgrade`/`postupgrade` hooks in `backend/main.mo` to serialize current in-memory authenticated user data into stable variables and restore it after upgrade.
- Persist and restore (at minimum) `userProfiles`, per-user per-day `dailyStats` (reps + sets keyed by `dayStamp`), and `userDailyGoals` without changing the existing public backend API.
- Update Counter and Stats screens to show an explicit error state with a Retry action when authenticated backend queries fail, rather than silently falling back to `0`, and refetch on retry.

**User-visible outcome:** After logging sets or setting daily goals while signed in, values remain the same after canister redeploy/upgrade, and if backend calls fail the app shows a clear error with Retry instead of displaying zeros.
