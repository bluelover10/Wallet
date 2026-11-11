# Master Development Plan — Remaining & Future Work

This covers what's genuinely left to do, based on the gaps identified during this project (not a generic template). Everything already shipped (design system, bug fixes, unit tests, dependency audit) is excluded — see `FINAL_REPORT.md` for what's done.

---

## Phase A — Live integration testing
**Priority: High.** Only real gap in current test coverage.

- [ ] Task A1: Run the app against a real local/staging MongoDB instance (blocked in the sandbox this project was built in — no `mongod` binary, and `mongodb-memory-server`'s download was network-blocked; this is a sandbox limitation, not a code issue)
  - Files: none (environment setup only)
  - Est: 30 min in a normal dev environment
- [ ] Task A2: Write Supertest integration tests for the full auth flow (register → login → protected route → logout), using `mongodb-memory-server` (already installed as a devDependency)
  - Files: `server/tests/integration/auth.test.js` (new)
  - Est: 2–3 hrs
- [ ] Task A3: Integration tests for savings/withdrawals CRUD + ownership rules, and goal deletion's orphan-cleanup against a real DB (currently only unit-tested with mocks)
  - Files: `server/tests/integration/savings.test.js`, `goals.test.js` (new)
  - Est: 3–4 hrs
- [ ] Task A4: Frontend component tests (React Testing Library + Vitest) for the three forms (SavingForm, WithdrawalForm, GoalForm) and their Zod validation error states
  - Files: `client/src/pages/*.test.jsx` (new), `client/vitest.config.js` (new)
  - Est: 3–4 hrs

## Phase B — Accessibility pass
**Priority: Medium.** Contrast + keyboard-nav done manually; automated/AT tooling still pending.

- [x] Task B1 (partial): Contrast ratios calculated for every color pair in the design system — found and fixed one real failure (`gold-400` as text, 2.83:1) via a theme-aware `gold-600`/`gold-100` pairing. See `docs/ACCESSIBILITY_AUDIT.md`.
- [ ] Task B1b: Run an automated a11y scan (axe-core or Lighthouse) against each page in both themes — not done, requires real browser access this working session didn't have
- [x] Task B3 (partial): Keyboard-navigation fixes applied to `Modal.jsx` (Escape-to-close, focus trap, ARIA dialog semantics, visible focus ring) and the mobile sidebar (Escape-to-close)
  - Files: `client/src/components/Modal.jsx`, `client/src/layouts/AppLayout.jsx` — done
- [ ] Task B4: Screen-reader pass (VoiceOver/NVDA) — not done, requires real assistive-tech tooling
  - Est: 2 hrs

## Phase C — Feature gaps (from Feature Inventory's "out of scope" list)
**Priority: Low/product decision, not a defect.**

- [ ] Task C1: Password-reset flow (forgot password email)
  - Files: new `passwordResetController.js`, email service integration
  - Est: 1 day (depends on email provider choice)
- [ ] Task C2: Email verification on registration
  - Est: 4–6 hrs
- [ ] Task C3: Admin UI for role management (currently `role: admin` exists in the data model with no way to assign it from the app)
  - Files: `server/controllers/userController.js`, new admin page
  - Est: 1 day

## Phase D — Operational readiness
**Priority: Medium, before real deployment.**

- [ ] Task D1: Add a `.github/workflows/ci.yml` (or equivalent) that runs `npm test` (server) and `npm run build` + `npm run lint` (client) on every PR — the test suite exists now but isn't wired into CI
  - Est: 1 hr
- [ ] Task D2: Environment variable validation on server startup (fail fast if `JWT_SECRET`, `MONGO_URI`, Cloudinary keys are missing) rather than failing at first use
  - Files: `server/server.js`
  - Est: 1 hr
- [ ] Task D3: Structured logging (replace/augment `morgan` with something that supports log levels and JSON output for production)
  - Est: 2–3 hrs

## Explicitly not planned
- Multi-tenant/multi-household support — current shared-single-workspace model is a deliberate design choice, not a limitation to fix
- Real-time updates (websockets) — polling via React Query's existing refetch is adequate for this app's usage pattern
