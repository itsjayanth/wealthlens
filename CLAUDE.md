# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

WealthLens is a client-facing wealth-management platform: clients link a
Sharekhan trading account and receive Buy/Sell/Hold recommendations from a
rule-based intelligence layer, applying the advisor's strategy to their live
portfolio. Recommendations are advisory-only — a client must approve a
recommendation before anything executes; there is no auto-trading yet.

This repo implements **Phase 1 (MVP "skateboard")** only: read-only
portfolio view + advisory recommendations with manual approve/reject. See
`PRD.md` section 12 for the full phased roadmap (advisor console, live trade
execution via API, then ML-based scoring are all later phases).

## Commands

```bash
# one-time setup
cp .env.example .env
npm install                              # installs all workspaces
npm run build:shared                     # compile packages/shared (apps import its dist)
npm run db:up                            # start Postgres via docker compose
npm run db:migrate --workspace apps/api  # apply apps/api/db/schema.sql

# day-to-day dev (two terminals)
npm run dev:api    # Express API, http://localhost:4000
npm run dev:web    # Next.js app, http://localhost:3000

# build / lint
npm run build             # builds shared -> api -> web, in that order
npm run lint --workspace apps/web   # next lint (only workspace with a lint script)

# db
npm run db:down    # stop the docker-compose Postgres
```

There is currently no test suite configured in any workspace (no test script
in any `package.json`). Don't assume a test runner exists — check before
referencing one.

`packages/shared` must be rebuilt (`npm run build:shared`) after changing its
source, since both apps import its compiled `dist/`, not `src/` directly.

## Architecture

**Monorepo** (npm workspaces): `apps/web` (Next.js 14 App Router + Tailwind),
`apps/api` (Express + TypeScript), `packages/shared` (types imported by
both, compiled to `dist/` — this is the contract between frontend and
backend, not just a types dump).

**`docs/API_CONTRACT.md` is the source of truth for every endpoint shape.**
Read it before adding or changing a route or a frontend API call — it
documents request/response bodies, auth requirements, and status codes that
aren't otherwise obvious from either app in isolation.

### Broker adapter seam

The Sharekhan integration is isolated behind `ShareKhanAdapter`
(`apps/api/src/broker/ShareKhanAdapter.ts`): `fetchHoldings`,
`fetchQuote`, `fetchHistorical`. `apps/api/src/broker/index.ts`
(`getBrokerAdapter()`) is the *only* place route handlers or the
recommendation engine should obtain an adapter instance — selection is via
`SHAREKHAN_ADAPTER` env var, currently only `"mock"`
(`mockAdapter.ts`, fabricates holdings/prices/history). Swapping in a real
Sharekhan SDK later means adding a new adapter implementation and a switch
case, never touching route handlers or the engine.

### Request flow

`apps/api/src/index.ts` wires routes under `/api/*` (auth, accounts,
portfolio, recommendations, audit-log) plus a catch-all 404 and a central
error handler that special-cases `ApiError` (`lib/errors.ts`) vs. anything
else (logged, 500). Routes go through `requireAuth` middleware
(`middleware/auth.ts`, verifies the JWT and sets `req.user`) then call into
`repositories/*` for Postgres access (`pg`, raw SQL, no ORM — see
`db/schema.sql`) and `lib/crypto.ts` for AES-256-GCM encryption of stored
broker credentials.

### Recommendation engine

`apps/api/src/engine/recommendationEngine.ts` is a pure rule-based scorer:
each rule (moving-average crossover, RSI, sector-concentration cap) casts a
weighted directional vote; `combineVotes` picks the highest-weighted
BUY/SELL/HOLD and derives confidence as that direction's share of total
weight. `reason` is the joined plain-language explanation of every rule
that fired. It takes holdings + a `ShareKhanAdapter` (for historical data)
and returns recommendations with no `id`/`status`/`timestamp` — the route
layer fills those in when persisting via `recommendationsRepo`.

### Frontend

App Router pages under `apps/web/src/app/*`. All backend calls go through
`apps/web/src/lib/api.ts` — a single typed fetch client that attaches the
bearer token and throws `ApiError` for the standard `{ error: { message,
code } }` shape. Don't scatter raw `fetch` calls in page components; add a
new function to this file instead. `apps/web/src/lib/auth.ts` handles token
storage in `localStorage` and `useRequireAuth()` and `useIsAuthenticated()`
hooks for guarding pages client-side.

### Auth

Email/password with bcrypt hashing; JWT signed with `JWT_SECRET`
(`{ sub: userId, role }` payload, expiry `JWT_EXPIRES_IN`). No refresh-token
flow yet — the frontend holds a single access token.
