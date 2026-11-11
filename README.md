# Personal Savings Record System

A MERN-stack application for tracking shared personal savings, withdrawals, and goals. **This is not a banking or payments application** — it only records transactions that happen elsewhere (via your bank/UPI app) so a group of people can track their shared savings pot together.

## Features

- **Authentication** — Register/login with JWT stored in an httpOnly cookie, rate-limited against brute force
- **Savings & Withdrawals** — Full CRUD, with search, filters (date range, amount range), sorting, and pagination
- **Screenshot attachments** — Attach up to 5 transaction screenshots per entry (PNG/JPEG/JPG/WEBP, 5MB max), stored on Cloudinary
- **Goals** — Target amount + deadline tracking with real progress bars (calculated from linked savings), deadline warnings, and an archive view
- **Dashboard** — Current balance, monthly/yearly totals, average/highest/lowest deposit, current saving streak, and Recharts visualizations (savings trend, contribution by user, withdrawal breakdown)
- **Reports** — Export all records as PDF, Excel, or CSV, optionally scoped to a date range
- **Activity log** — Every meaningful action (login, logout, create/update/delete) is recorded and viewable in a paginated history
- **Dark mode** — Toggle with system-preference detection and persistence
- **PWA** — Installable, works offline for the app shell (API calls always go to network, since savings data must stay fresh)
- **Security** — Helmet, CORS allowlist, rate limiting, Zod validation on every write route, and Mongo-operator-injection stripping

## Tech Stack

**Backend:** Node.js, Express 5, MongoDB/Mongoose, JWT, Cloudinary, Multer, Zod, ExcelJS, PDFKit
**Frontend:** React 19, Vite, Tailwind CSS v4, React Query, React Hook Form + Zod, Recharts, Framer Motion, vite-plugin-pwa

## Project Structure

```
Wallet/
├── server/               # Express API
│   ├── config/           # DB + Cloudinary config
│   ├── controllers/      # Route handlers
│   ├── middleware/       # auth, validation, upload, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── utils/            # generateToken, activityLogger, cloudinaryService
│   └── validators/       # Zod schemas
└── client/               # React SPA
    ├── src/
    │   ├── components/   # Reusable UI (forms, modal, filter bar, pagination, uploader)
    │   ├── context/      # Auth + Theme providers
    │   ├── layouts/      # AuthLayout, AppLayout (sidebar/nav)
    │   ├── pages/         # Route-level pages
    │   └── services/     # Axios instance
    └── public/           # Static assets + PWA icons
```

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or Atlas)
- A free [Cloudinary](https://cloudinary.com) account (for screenshot uploads)

### 1. Install everything (one command, from the project root)

```bash
npm run install-all
```

This installs the root tooling (`concurrently`), then the server and client dependencies, in one go.

### 2. Configure Environment Variables

Copy `server/.env.example` to `server/.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/savings-tracker
JWT_SECRET=replace-with-a-long-random-string
NODE_ENV=development
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run in Development (server + client together)

From the project root:

```bash
npm run dev
```

This runs the Express API and the Vite client **at the same time** in one terminal, labeled `[0]` (server) and `[1]` (client). The client runs on `http://localhost:5173` and proxies API calls to `http://localhost:5000/api`. Press `Ctrl+C` once to stop both.

If you ever want to run them separately instead:

```bash
npm run server   # just the API, on :5000
npm run client   # just the Vite dev server, on :5173
```

### 4. Build for Production

```bash
npm run build
```

This builds the client (outputting to `client/dist/`, including the PWA service worker and manifest) via the root script. Serve `client/dist/` with any static file host (or behind the same Express server / a reverse proxy), and run `npm start` (or `node server/server.js`) with `NODE_ENV=production`.

## Deployment Notes

- Set `NODE_ENV=production` so cookies are marked `secure` and `sameSite=strict`.
- Set `CLIENT_URL` to your deployed frontend origin (used for CORS).
- Use a managed MongoDB (e.g. Atlas) and a real Cloudinary account — the demo placeholders in `.env.example` will not work.
- The rate limiter defaults to 300 requests / 15 min per IP for general API traffic, and 20 / 15 min for auth endpoints — adjust in `server.js` / `authRoutes.js` if needed for your expected traffic.

## API Documentation

See [`server/API_DOCUMENTATION.md`](./server/API_DOCUMENTATION.md) for the full endpoint reference.

## Known Limitations / Follow-ups

- `Withdrawal.attachments` (legacy single-URL field) is retained for backward compatibility but no longer written to — new uploads use the `screenshots` array on both Savings and Withdrawals.
- Report exports load matching records into memory before generating the file; for very large datasets (tens of thousands of records) this should be paginated/streamed.
