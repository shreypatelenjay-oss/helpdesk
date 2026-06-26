# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is a Bun monorepo with two workspaces: `client` and `server`.

```bash
# Run both client and server in dev mode (from root)
bun run dev

# Run individually
cd client && bun run dev   # Vite dev server on :3000
cd server && bun run dev   # Express server on :8000 (watch mode)

# Build
bun run build              # builds both
cd client && bun run build # tsc + vite build
cd server && bun run build # bun build → dist/

# Install dependencies
bun install
```

## Architecture

**Monorepo structure:** `client/` (React + Vite) and `server/` (Express + Bun), run independently. The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so the client talks to the server via relative `/api` paths.

**Planned stack (not yet implemented — see `implementation-plan.md`):**
- Frontend: Next.js + Tailwind CSS + shadcn/ui (currently plain React/Vite scaffold)
- Backend: Next.js API routes, PostgreSQL via Prisma, NextAuth.js (credentials + DB sessions)
- AI: Claude API (Anthropic) for ticket classification and reply suggestion
- Email: SendGrid or Postmark (inbound webhook → ticket, outbound reply)
- Deploy: Vercel + Supabase/Neon

**Domain model (target):**
- **Tickets** — status: `open | resolved | closed`; category: `general question | technical question | refund request`
- **Users** — roles: `admin` (manages agents) and `agent` (works tickets)
- AI auto-classifies tickets on inbound email and suggests draft replies from a knowledge base

**Key planned API routes:**
- `POST /api/inbound-email` — email webhook, creates ticket + triggers AI classification
- `GET /api/tickets` — list with status/category filters
- `GET /api/tickets/[id]/suggest-reply` — returns AI-generated draft
- `POST /api/tickets/[id]/reply` — sends reply via email, marks resolved
- `POST /api/users` / `GET /api/users` / `DELETE /api/users/[id]` — admin-only agent management

## Authentication

Auth is implemented with **better-auth** (email/password, DB sessions via Prisma/PostgreSQL). Sign-up is disabled — only seeded users can log in.

**Server (`server/src/lib/auth.ts`):**
- `betterAuth` is configured with `prismaAdapter`, `emailAndPassword` (sign-up disabled), `BETTER_AUTH_SECRET`, `BASE_URL`, and `TRUSTED_ORIGINS` env vars.
- All auth routes are mounted at `app.all("/api/auth/*splat", toNodeHandler(auth))` in `server/src/index.ts`.

**Middleware (`server/src/middleware/requireAuth.ts`):**
- `requireAuth` calls `auth.api.getSession` and attaches `req.user` / `req.session`.
- Returns 401 if no valid session. Use this on all protected routes.

**Client (`client/src/lib/auth-client.ts`):**
- `authClient = createAuthClient()` — no base URL needed (Vite proxy handles `/api/auth/*`).
- Use `authClient.useSession()` for reactive session state.
- Use `authClient.signIn.email({ email, password })` to sign in; `authClient.signOut()` to sign out.

**Required env vars (server):**
- `BETTER_AUTH_SECRET` — random secret
- `DATABASE_URL` — PostgreSQL connection string
- `BASE_URL` — server origin (default: `http://localhost:8000`)
- `TRUSTED_ORIGINS` — comma-separated client origins (default: `http://localhost:3000`)

## Testing

E2e tests use **Playwright** (configured at the monorepo root).

```bash
bun run test:e2e   # run from monorepo root
```

**Test database:** `helpdesk_test` (separate PostgreSQL DB — never touches `helpdesk`).  
**Test env vars:** `server/.env.test`  
**Global setup:** runs `prisma migrate deploy` + seeds `admin@test.local` before the suite.  
**Global teardown:** runs `prisma migrate reset --force` after the suite.  
**Artifacts:** `e2e/test-results/`, `e2e/playwright-report/`

### Writing Tests

Always use the **`playwright-e2e-writer` agent** to write e2e tests — never write them by hand in the main conversation. Trigger it:
- After implementing any significant feature or UI flow
- When the user explicitly asks for e2e tests

The agent has full knowledge of the test infrastructure, seeded credentials, and Playwright best practices for this codebase.

## Client conventions

- **HTTP:** Use `axios` for all API calls — never `fetch`.
- **Server state:** Use **TanStack Query** (`useQuery`, `useMutation`) for all data fetching and mutations. Use `invalidateQueries` on success to keep the cache in sync. Never manage loading/error/data state manually with `useState`.

## Documentation

Use the **context7 MCP** (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`) to fetch up-to-date documentation for any library before implementing — especially Prisma, NextAuth.js, shadcn/ui, Anthropic SDK, and Vite/React.
