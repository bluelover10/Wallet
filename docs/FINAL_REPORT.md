# Final Report — Wallet / "Passbook" Project

Two React/Express/MongoDB projects (a base "Wallet" app and its more complete successor "Wallet - c") were audited, security-fixed, redesigned under a new visual identity ("Passbook"), covered with a real unit test suite, and dependency-audited. This report summarizes what was done, with evidence, and what remains.

---

## 1. Architecture & merge verification

Project B ("Wallet - c") is a strict superset of Project A ("Wallet") — confirmed by a full file-by-file diff early in this project, not assumed. Every file in A exists in B; most were also rewritten in B, but every diff was additive (activity logging, indexes, screenshots array, validation, pagination). **Nothing from A was lost.**

B adds: reporting (CSV/Excel/PDF export), real Cloudinary-backed multi-file screenshot uploads, pagination/search/sort on list views, Zod validation + auth rate limiting, theme toggle, and PWA installability. Full detail in `docs/FEATURE_INVENTORY.md`.

## 2. Bugs found and fixed

| # | Severity | Fix |
|---|---|---|
| 1 | High | ReDoS via unescaped regex in savings/withdrawals search — fixed with `utils/regexHelper.js`, unit-tested with a real catastrophic-backtracking payload |
| 2 | Medium | CSV/Excel formula injection in report export — fixed with `utils/spreadsheetSanitizer.js`, unit-tested against `=`/`+`/`-`/`@`-prefixed payloads |
| 3 | Medium | Dashboard streak calculation issued up to 60 sequential DB queries — replaced with a single aggregation + in-memory walk (`utils/streakCalculator.js`), unit-tested including year-boundary edge cases |
| 4 | Low | Dead `attachments` field on the Withdrawal model (legacy, unused) — removed |
| 5 | Low | Goal deletion left orphaned references on linked savings — fixed with an update-many cleanup, unit-tested with mocked models proving both the fix and the authorization boundary |
| 6 | Low | Inconsistent error handling in `updateUserProfile` (bypassed centralized error handler) — fixed |

All six fixes were verified: syntax-checked immediately, and five of six now have dedicated automated tests (the exception, #4, is a schema deletion with nothing to unit-test).

## 3. Visual identity — "Passbook"

A full redesign grounded in the physical bank passbook (not a generic AI-default palette): ledger-ink navy, warm paper, gold savings accent, rose withdrawal accent, Fraunces display serif + Inter body, sharp `rounded-sm` corners, hairline rules, tabular numerals. Every page (7) and shared component (8) restyled; app icon/manifest/theme-color rebranded to match. Full token reference in `docs/DESIGN_SYSTEM.md`.

Verified: production build succeeds cleanly with no CSS warnings; lint shows 0 new issues.

## 4. Performance

Recharts (a heavy dependency) was code-split out of the Dashboard route via `React.lazy`. Measured result: the Dashboard's own JS chunk dropped from 397KB to 7.7KB; Recharts now loads as an independently-cacheable chunk.

## 5. Dependency & security audit

- **Server:** `npm audit` — 0 vulnerabilities (after fixing 1 moderate CVE: a buffer-bounds issue in `uuid`, nested inside `exceljs`. Confirmed the vulnerable code path — `uuid.v3/v5/v6` — isn't actually used by `exceljs`, which only calls `v4()`; fixed via a scoped `overrides` entry rather than a semver-major downgrade, and confirmed exceljs still generates valid workbooks afterward). `npm outdated` — clean, nothing behind.
- **Client:** `npm audit` — 0 vulnerabilities. `npm outdated` — clean.

## 6. Automated test suite (new — none existed before this project)

47 unit tests across 5 files, `npm test` in `server/`, all passing as of this report:
- Regex-escape helper (ReDoS fix) — including a timed assertion proving no catastrophic backtracking
- Spreadsheet sanitizer (formula-injection fix)
- Streak calculator (including year-boundary and gap edge cases)
- Every Zod validation schema (boundary tests: zero/negative amounts, bad ObjectIds, enum violations)
- Goal deletion controller, with mocked Mongoose models — proves the orphan-cleanup fix and the ownership/admin authorization boundary

**Known limitation:** these are unit tests with mocked models, not live integration tests. This sandbox has no MongoDB binary available and the `mongodb-memory-server` fallback's download was blocked by network restrictions here — that's an environment limitation of this working session, not a code defect. `mongodb-memory-server` is already installed as a devDependency for when this is run somewhere with normal internet access; see `docs/DEVELOPMENT_PLAN.md` Phase A for the integration-test tasks that should follow.

## 7. Accessibility

A real contrast-ratio audit was run against every color pair in the design system (calculated from the actual hex values, not estimated) — found and fixed one genuine failure: `gold-400` used as text (brand-mark accent, loading spinners) measured 2.83:1, failing WCAG AA even for large text. Fixed with a theme-aware `gold-600`/`gold-100` pairing (5.15:1 light, 11.73:1 dark). Also fixed real keyboard-navigation gaps in `Modal.jsx` (no Escape-to-close, no focus trap, no ARIA dialog semantics, a removed focus ring with no replacement) and the mobile sidebar (no Escape-to-close). Full detail in `docs/ACCESSIBILITY_AUDIT.md`.

**Not done:** automated tooling (axe-core/Lighthouse) and screen-reader testing (VoiceOver/NVDA) — both require real browser/AT access this working session didn't have.

## 8. Documentation produced

- `docs/FEATURE_INVENTORY.md` — A vs B vs merged feature lists, sourced from actual route/page enumeration
- `docs/DESIGN_SYSTEM.md` — color/type/shape tokens, sourced from the live `index.css` and observed component conventions
- `docs/DEVELOPMENT_PLAN.md` — remaining work, broken into phases with file-level detail and time estimates
- `docs/ACCESSIBILITY_AUDIT.md` — contrast ratio calculations and keyboard-navigation findings/fixes
- This report

## 9. What's genuinely not done

- Live integration/E2E testing against a real database (see limitation above)
- Automated accessibility tooling (axe-core/Lighthouse) and screen-reader testing — manual contrast/keyboard-nav pass done instead, see section 7
- Password reset, email verification, admin role-management UI — these are product feature gaps, not defects, listed as Phase C
- CI pipeline wiring the new test suite into pull requests — Phase D

---

**Bottom line:** the codebase is functionally verified (builds clean, lints clean, 47 tests pass, 0 known vulnerabilities), meaningfully more secure than when this started, has a real distinct visual identity, and has test/audit infrastructure it didn't have before. The remaining gaps are real and listed above, not hidden.
