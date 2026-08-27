# Luma Restaurant

A premium restaurant website with a React frontend, an Express API, and a PostgreSQL database — menu browsing, reservations, online ordering, reviews, contact, and an admin dashboard.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, shadcn/ui components
- API: Express 5
- Database: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from an OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/luma-restaurant` — the React + Vite restaurant frontend
- `artifacts/api-server` — the Express API
- `artifacts/mockup-sandbox` — a local component preview server (dev tool only)
- `lib/db` — PostgreSQL/Drizzle connection and schema
- `lib/api-spec/openapi.yaml` — API contract source
- `lib/api-client-react` and `lib/api-zod` — generated/shared API clients and schemas

## Getting started

### 1. Prerequisites

- Node.js 24+
- pnpm (`npm install -g pnpm`)
- A PostgreSQL 16 database (local install, Docker, or a hosted instance)

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgresql://user:password@localhost:5432/luma` |
| `SESSION_SECRET` | Yes | A long random string used to sign JWTs |
| `JWT_SECRET` | No | Overrides `SESSION_SECRET` for JWT signing if you want a separate value |
| `LOG_LEVEL` | No | API logger level; defaults to `info` |
| `PORT` | No | Port for whichever service you're running; each service has its own sensible default if unset |
| `BASE_PATH` | No | Base path for the frontend build; defaults to `/` |

### 4. Set up the database

Push the Drizzle schema to your database, then (optionally) seed it with sample data:

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run seed
```

### 5. Run the app locally

In separate terminals:

```bash
# API server (defaults to http://localhost:4000, proxies at /api)
pnpm --filter @workspace/api-server run dev

# Frontend (defaults to http://localhost:5173)
pnpm --filter @workspace/luma-restaurant run dev
```

The frontend expects the API to be reachable at `/api` — if you run the two servers on different ports locally, add a proxy in `artifacts/luma-restaurant/vite.config.ts` (a `server.proxy` block pointing `/api` at your API server) or serve them behind the same reverse proxy in production.

### Other useful commands

```bash
pnpm run typecheck                                   # typecheck across all packages
pnpm run build                                        # typecheck + build all packages
pnpm --filter @workspace/mockup-sandbox run dev       # component preview server
pnpm --filter @workspace/api-spec run codegen         # regenerate API hooks and Zod schemas
```

## Product

Luma is a premium restaurant website with:

- **Public site** — home, menu (with search/filter/ordering), our story, reservations, and contact pages
- **Accounts** — sign up / sign in, JWT-based sessions
- **Reviews** — customers can browse approved reviews and submit their own (pending admin approval)
- **Admin dashboard** (`/admin`, admin accounts only) — key stats, order management, reservation management, contact message triage, menu/category management, and review moderation

## Creating an admin account

There's no separate admin sign-up flow — an admin is just a user whose `role` column is `admin`. After registering a normal account through the site, promote it from the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Sign out and back in afterwards so a fresh token picks up the new role.

## Deploying

This is a plain Node.js monorepo — it will run on any host that can run `pnpm install`, `pnpm run build`, and serve the resulting frontend (`artifacts/luma-restaurant/dist/public`) and API (`artifacts/api-server/dist`) processes, as long as `DATABASE_URL` and `SESSION_SECRET` are set in that environment.
