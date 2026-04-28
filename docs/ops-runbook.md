# Auth Incident Runbook

## Alert triggers

- `loginSuccessRate < 0.9` on `/api/ops/metrics`.
- Sudden spike in `AUTH_TEMPORARILY_LOCKED`.
- Repeated `password_reset_failed`.

## First response

1. Check recent structured logs for `requestId`, `route`, `errorCode`.
2. Validate DB availability and migration status.
3. Verify `AUTH_SECRET`, `DATABASE_URL`, and `APP_BASE_URL`.

## Recovery steps

1. If brute force spike, tighten in-memory limiter thresholds.
2. If registration failures spike, inspect `register_failed` events.
3. If reset links fail, verify token expiry and clock sync.

## Rollback

1. Revert to previous release.
2. Apply hotfix for auth route only.
3. Run smoke tests on `register/login/forgot/reset`.
