# Feature Inventory — Project A vs Project B vs Merged (Passbook)

Compiled by enumerating actual route files, pages, and models in both codebases (not from memory).

---

## Project A ("Wallet") — Feature List

**Pages (8):** Dashboard, Savings, Withdrawals, Goals, History, Login, Register, Settings

**API surface (7 route files, no reports):**
- Auth: register, login, logout, get current user
- Savings: list, create, update, delete (single `attachments` URL field, no real file upload)
- Withdrawals: list, create, update, delete (same single-URL attachment pattern)
- Goals: list, create, update, delete
- Statistics: dashboard aggregate stats
- Activity: activity log list
- User: profile update

**Notable characteristics:**
- No pagination, filtering, or search on list endpoints
- No file upload middleware — screenshots are a plain string URL field, unused in the UI
- No Zod/schema validation layer — relies on Mongoose schema validation only
- No rate limiting on auth endpoints
- No CSV/Excel/PDF export
- No PWA support

## Project B ("Wallet - c") — Feature List

**Pages (9):** All of Project A's pages, **plus Reports**

**API surface (8 route files):**
- Everything in Project A, plus:
  - **Reports**: CSV export, Excel export (via `exceljs`), PDF export (via `pdfkit`), both with optional date-range filtering
  - **Savings/Withdrawals**: real multi-file screenshot upload (Cloudinary-backed, `multer` + `cloudinary` SDK), with a dedicated delete-single-screenshot endpoint
  - **Savings/Withdrawals list**: pagination, sorting (by date/amount/month), search (with a regex, later fixed for ReDoS), date-range filtering
  - **Auth**: rate limiting on register/login (20 req / 15 min), Zod schema validation on every mutating route
  - **Activity log**: entries are now written automatically on register, login, logout, profile update, and every CRUD action across savings/withdrawals/goals (Project A only logged a subset)
- **PWA support**: installable app, offline app-shell caching, manifest + icons (`vite-plugin-pwa`)
- **Light/dark theme toggle** (Project A had no theme system)

**Conclusion:** B is a strict superset of A. Every feature in A exists in B; B adds reporting, real file uploads, list-management UX (pagination/search/sort), stronger security (validation, rate limiting), theming, and PWA installability. No functionality was lost when B superseded A — confirmed by direct file-by-file diff earlier in this project.

---

## Master Feature List (current, merged, "Passbook")

### Authentication & account
- Register, login, logout (JWT in httpOnly cookie, `sameSite: strict`)
- Rate-limited auth endpoints (20 attempts / 15 min)
- Profile update (name, email, password) with Zod validation
- Shared-household model: all authenticated users see all savings/withdrawals/goals (by design, not a bug)

### Savings
- Create/edit/delete a saving entry (amount, type [Monthly/Extra], payment method, linked goal, notes, date)
- Up to 5 screenshot attachments per entry (Cloudinary-hosted)
- Search, sort (date/amount/month), date-range filter, pagination

### Withdrawals
- Create/edit/delete a withdrawal (amount, reason, notes, date)
- Up to 5 screenshot attachments per entry
- Search, sort, date-range filter, pagination

### Goals
- Create/edit/delete/archive a savings goal (name, target amount, deadline, description, status)
- Real-time progress calculated from linked savings (aggregation, not stored)
- Deadline warnings (≤30 days) and overdue flags
- Orphan-safe deletion (linked savings' goal reference is cleared, not left dangling)

### Dashboard
- Current balance, total savings/withdrawals, this-month total + growth %
- Average/highest/lowest deposit, active goal count, saving streak (consecutive months)
- Charts: 6-month savings trend, contribution-by-user, withdrawal-by-reason
- Recent activity feed, goal progress bars

### Reports
- Export CSV, Excel (multi-sheet), or PDF, with optional date-range filter
- Formula-injection-safe (user text fields sanitized before spreadsheet export)

### Activity history
- Paginated log of every register/login/logout/CRUD action across the app, with actor and timestamp

### Cross-cutting
- Light/dark theme toggle (persisted)
- PWA: installable, offline app-shell caching, network-only for API calls
- Responsive layout (mobile sidebar/burger menu)

---

## What's explicitly out of scope / not present
- No multi-household support — this is a single shared workspace per deployment
- No email verification or password-reset flow
- No role management UI (admin role exists in the data model but there's no way to promote/demote users from the app itself)
- No automated integration/E2E tests against a live database (unit tests only — see Phase 13 notes)
