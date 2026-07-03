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

**Stack:**
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- Backend: Express 5 + Bun + PostgreSQL via Prisma
- Auth: better-auth (email/password, DB sessions)
- UI components: shadcn/ui — when adding a new component, copy the pattern from `client/src/components/ui/input.tsx` (wraps base-ui primitives); `bunx shadcn@latest add` may fail in this environment

**Domain model:**
- **Tickets** — status: `OPEN | RESOLVED | CLOSED`; category: `GENERAL_QUESTION | TECHNICAL_QUESTION | REFUND_REQUEST`
- **Users** — roles: `ADMIN` (manages agents) and `AGENT` (works tickets)
- **Replies** — `senderType: AGENT | CUSTOMER`; agents reply via the UI, customer replies come from inbound email

**Implemented API routes:**
- `POST /api/inbound-email` — email webhook, creates ticket
- `GET /api/tickets` — list with status/category/assignee filters, sorting, pagination, search
- `GET /api/tickets/:id` — ticket detail including replies
- `PATCH /api/tickets/:id` — update status, category, assignedTo
- `POST /api/tickets/:id/reply` — add an agent reply (sets `senderType: AGENT`)
- `POST /api/tickets/:id/summarize` — AI-generated summary of the ticket description + conversation history (Gemini 2.5 Flash); returns `{ summary: string }`
- `POST /api/tickets/polish-reply` — AI polish of a draft reply (Gemini 2.5 Flash); returns `{ polished: string }`
- `GET /api/users/agents` — list active agents (for assignee dropdown)
- `GET /api/users` / `POST /api/users` / `PATCH /api/users/:id` / `DELETE /api/users/:id` — admin-only agent management

## Authentication

Auth is implemented with **better-auth** (email/password, DB sessions via Prisma/PostgreSQL). Sign-up is disabled — only seeded users can log in.

**Server (`server/src/lib/auth.ts`):**
- `betterAuth` is configured with `prismaAdapter`, `emailAndPassword` (sign-up disabled), `BETTER_AUTH_SECRET`, `BASE_URL`, and `TRUSTED_ORIGINS` env vars.
- All auth routes are mounted at `app.all("/api/auth/*splat", toNodeHandler(auth))` in `server/src/index.ts`.

**Express version:** The server uses **Express 5**, which automatically forwards rejected promises to the error handler — never wrap route handlers in `try/catch`. The only exception is when a route needs to handle an error itself (e.g. the `/api/health` endpoint that returns a degraded status instead of a 503).

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
- `GMAIL_USER` — Gmail address used to send outbound reply emails (see `server/src/lib/mailer.ts`)
- `GMAIL_APP_PASSWORD` — Gmail App Password for `GMAIL_USER` (requires 2FA on the Google account; not the account's normal login password). Used for both outbound SMTP sending (`server/src/lib/mailer.ts`) and inbound IMAP polling (`server/src/lib/imapPoll.ts`) — requires IMAP enabled on the Gmail account (Gmail Settings → "Forwarding and POP/IMAP" → Enable IMAP)
- `SENTRY_DSN` — Sentry DSN for server-side error tracking (`server/src/lib/sentry.ts`). Optional; when unset, Sentry init is skipped.

**Required env vars (client):**
- `VITE_SENTRY_DSN` — Sentry DSN for client-side error tracking (`client/src/main.tsx`). Optional; when unset, Sentry init is skipped.

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

**Prefer component tests over e2e tests.** Most UI behaviour — rendering, loading/error states, conditional display, badge logic, empty states — should be covered by Vitest + React Testing Library component tests. They are faster, more focused, and easier to maintain.

**Use e2e tests only for scenarios that cannot be tested any other way:**
- Authentication flows (login, logout, session persistence)
- Route-level access control (unauthenticated redirect, role-based guards)
- Server persistence — e.g. a mutation followed by a real page reload that proves the server stored the value
- Full round-trips where the real network response drives a UI update that mocked axios cannot faithfully reproduce

**Do NOT write e2e tests for:**
- Rendering output (text, badges, labels) — use component tests
- API calls and their payloads — mock axios in component tests
- Form validation, loading states, error messages — component tests
- Any behaviour that can be asserted by mocking axios in a component test

When in doubt, ask: "Does this test break if I swap the real server for a mock?" If no — write a component test instead.

Always use the **`playwright-e2e-writer` agent** to write e2e tests — never write them by hand in the main conversation.

**API helper (`e2e/helpers/api.ts`):** For e2e tests that call the Express server directly (not via browser), use the shared helpers in `e2e/helpers/api.ts` instead of inlining `request.post(...)` calls. For example, `postWebhook(request, data, secret?)` wraps the `POST /api/inbound-email` call with the correct URL and `x-webhook-secret` header. Add new helpers to this file whenever a new API endpoint needs direct e2e coverage.

## Component tests

Component tests use **Vitest** + **React Testing Library** + **happy-dom**, configured in `client/vite.config.mts`.

```bash
cd client && bun run test        # run all component tests once
cd client && bun run test:watch  # watch mode
cd client && bun run test:write  # use Claude to write tests for untested components
```

**Writing tests:**
- Test files live next to the component: `src/pages/Foo.test.tsx`
- Always use the `renderWithQuery` helper from `src/test/render.tsx` — it wraps the component in `QueryClientProvider` + `MemoryRouter`
- Mock `axios` with `vi.mock("axios")` and `vi.mocked(axios, true)`
- Mock `../components/Navbar` in page tests to keep them focused
- Follow the patterns in `src/pages/UsersPage.test.tsx`

## Client conventions

- **HTTP:** Use `axios` for all API calls — never `fetch`.
- **Server state:** Use **TanStack Query** (`useQuery`, `useMutation`) for all data fetching and mutations. Use `invalidateQueries` on success to keep the cache in sync. Never manage loading/error/data state manually with `useState`. Exception: one-shot AI results (e.g. the ticket summary) that are not part of the server cache may be held in local `useState`.
- **Forms:** Use **React Hook Form** + **Zod** for all forms. Define a `z.object(...)` schema, derive the type with `z.infer<typeof schema>`, and wire them together via `zodResolver` from `@hookform/resolvers/zod`. Use `register`, `handleSubmit`, and `formState.errors` — never manage form state or validation manually with `useState`.
- **Shared types & schemas:** The `core` package (`@repo/core`) is the single source of truth for domain enums (e.g. `Role`), union types (e.g. `TicketStatus`, `SenderType`), and Zod schemas (e.g. `createUserSchema`, `createReplySchema`) shared between client and server. Import from `@repo/core` in both. Never hardcode role strings like `"ADMIN"` or `"AGENT"` anywhere — always use the `Role` enum (`Role.ADMIN`, `Role.AGENT`). Never inline domain union types like `"OPEN" | "RESOLVED" | "CLOSED"` or `"AGENT" | "CUSTOMER"` — always declare them in `core` and import from `@repo/core`. This applies to components, routes, middleware, and test fixtures.

## Documentation

Use the **context7 MCP** (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`) to fetch up-to-date documentation for any library before implementing — especially Prisma, NextAuth.js, shadcn/ui, Anthropic SDK, and Vite/React.
