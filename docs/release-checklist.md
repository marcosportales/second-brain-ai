# Release Checklist

## Pre-deploy

- [ ] Run `npm run lint`.
- [ ] Run auth unit/integration tests.
- [ ] Validate migrations are applied.
- [ ] Verify `/api/ops/metrics` returns expected fields.

## Smoke test

- [ ] Register user.
- [ ] Verify email link.
- [ ] Login with verified user.
- [ ] Forgot password flow.
- [ ] Upload document and tag it.
- [ ] Run search and save query.

## Rollback readiness

- [ ] Previous deployment artifact available.
- [ ] DB migration rollback strategy documented.
- [ ] On-call notified with runbook link.
