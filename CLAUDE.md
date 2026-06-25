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

## Documentation

Use the **context7 MCP** (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`) to fetch up-to-date documentation for any library before implementing — especially Prisma, NextAuth.js, shadcn/ui, Anthropic SDK, and Vite/React.
