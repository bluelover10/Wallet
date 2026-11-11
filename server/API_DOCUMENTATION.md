# API Documentation

Base URL: `http://localhost:5000/api` (development)

All authenticated endpoints require the `jwt` httpOnly cookie set by `/auth/login` or `/auth/register`. There is no separate Bearer token flow — the browser sends the cookie automatically when `withCredentials: true` is set (already configured in the client's axios instance).

Rate limits: general API — 300 requests / 15 min per IP. Auth endpoints (`/auth/register`, `/auth/login`) — 20 requests / 15 min per IP.

---

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Create an account. Body: `{ name, email, password }` |
| POST | `/login` | Public | Log in. Body: `{ email, password }` |
| POST | `/logout` | Public | Clears the auth cookie |
| GET | `/me` | Private | Returns the current user |

## Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| PUT | `/profile` | Private | Update `{ name?, email?, password? }` |

## Savings — `/api/savings`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Private | List savings. See query params below. |
| POST | `/` | Private | Create. `multipart/form-data` with fields + up to 5 `screenshots` files |
| PUT | `/:id` | Private | Update. Same shape as POST; new files are appended to existing screenshots |
| DELETE | `/:id` | Private | Delete a saving (and its Cloudinary screenshots) |
| DELETE | `/:id/screenshots/:publicId` | Private | Remove a single screenshot (publicId must be URL-encoded) |

**Query params for `GET /`:** `search`, `month`, `year`, `goal`, `user`, `minAmount`, `maxAmount`, `startDate`, `endDate`, `sortBy` (`date`\|`amount`\|`createdAt`\|`month`\|`year`), `order` (`asc`\|`desc`), `page`, `limit` (max 100).

**Response shape:** `{ data: [...], pagination: { total, page, limit, totalPages } }`

**Body fields:** `amount` (required, >0), `date`, `month` (required), `year` (required), `paymentMethod` (`Cash`\|`UPI`\|`Bank Transfer`\|`Credit Card`\|`Debit Card`\|`Wallet`\|`Other`), `type` (`Monthly`\|`Extra`), `goal` (optional Goal ID to link), `referenceNumber`, `notes`.

## Withdrawals — `/api/withdrawals`

Same pattern as Savings (list/create/update/delete + screenshot deletion), minus the `goal`/`month`/`year`/`paymentMethod`/`type` fields. Body: `amount`, `reason` (required), `date`, `notes`.

**Query params for `GET /`:** `search`, `user`, `minAmount`, `maxAmount`, `startDate`, `endDate`, `sortBy` (`date`\|`amount`\|`createdAt`), `order`, `page`, `limit`.

## Goals — `/api/goals`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Private | List goals with real-time progress |
| POST | `/` | Private | Create. Body: `{ name, targetAmount, deadline, description?, status? }` |
| PUT | `/:id` | Private | Update, including `{ archived: true/false }` to archive/restore |
| DELETE | `/:id` | Private | Delete a goal |

**Query params for `GET /`:** `archived` (`true`\|`false`), `status` (`In Progress`\|`Achieved`\|`Cancelled`).

**Response fields per goal:** `savedAmount` (sum of linked savings), `progressPercent` (0–100), `daysToDeadline`, `deadlineWarning` (true if ≤30 days left and in progress), `isOverdue`.

## Statistics — `/api/statistics`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Private | Dashboard aggregate stats |

**Response includes:** `totalSavings`, `totalWithdrawals`, `currentBalance`, `currentMonthSavings`, `yearlySavings`, `savingsGrowth` (% vs last month), `averageDeposit`, `highestDeposit`, `lowestDeposit`, `currentStreak` (consecutive months with ≥1 saving), `contributionByUser`, `withdrawalByReason` (top 5), `savingsTrend` (last 6 months), `activeGoals` (top 5 with progress), `recentActivity` (last 5).

## Activity Log — `/api/activity`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Private | Paginated activity log. Query: `page`, `limit` (max 100). Response: `{ data, pagination }` |

## Reports — `/api/reports`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/csv` | Private | Download combined savings+withdrawals as CSV |
| GET | `/excel` | Private | Download as an .xlsx workbook (separate Savings/Withdrawals sheets) |
| GET | `/pdf` | Private | Download a print-friendly PDF summary |

All three accept optional `startDate` / `endDate` query params (ISO date strings) to scope the report.

---

## Error Format

Validation errors (400): `{ "message": "field: reason, field2: reason2" }`
Auth errors (401): `{ "message": "Not authorized, no token" }` (or similar)
Not found (404): `{ "message": "<Resource> not found" }`
Server errors (500): `{ "message": "...", "stack": "..." }` (stack only in non-production)
