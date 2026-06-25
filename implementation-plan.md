# Implementation Plan

## Phase 1 — Project Setup & Infrastructure

- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS and install shadcn/ui
- [ ] Set up PostgreSQL database (Supabase or Neon)
- [ ] Configure Prisma and connect to database
- [ ] Define Prisma schema (users, sessions, tickets, categories)
- [ ] Run initial migration
- [ ] Set up environment variables (.env)
- [ ] Initialize git repository

---

## Phase 2 — Authentication

- [ ] Install and configure NextAuth.js with credentials provider
- [ ] Configure database session strategy via Prisma adapter
- [ ] Build login page (email + password)
- [ ] Implement session-based route protection (middleware)
- [ ] Seed the database with the initial admin account
- [ ] Test login, session persistence, and logout

---

## Phase 3 — User Management (Admin)

- [ ] Build "Create Agent" form (admin only)
- [ ] API route: POST /api/users — create agent account
- [ ] API route: GET /api/users — list all agents
- [ ] API route: DELETE /api/users/[id] — deactivate agent
- [ ] Build agent list page (admin dashboard)
- [ ] Restrict user management routes to admin role

---

## Phase 4 — Ticket Data Model & Core API

- [ ] Finalize ticket schema: id, subject, body, status, category, sender email, assigned agent, timestamps
- [ ] API route: GET /api/tickets — list tickets (with filters: status, category)
- [ ] API route: GET /api/tickets/[id] — get single ticket
- [ ] API route: PATCH /api/tickets/[id] — update status, category, or assigned agent
- [ ] API route: POST /api/tickets — manually create a ticket (for testing)

---

## Phase 5 — Email Integration

- [ ] Set up SendGrid or Postmark account
- [ ] Configure inbound email parsing (webhook endpoint)
- [ ] Build API route: POST /api/inbound-email — receives parsed email, creates ticket
- [ ] Map email fields to ticket fields (sender, subject, body)
- [ ] Build outbound reply function — send email via SendGrid/Postmark API
- [ ] API route: POST /api/tickets/[id]/reply — sends reply and marks ticket resolved
- [ ] Test end-to-end: send email → ticket created → reply sent

---

## Phase 6 — AI Integration

- [ ] Install Anthropic SDK and configure API key
- [ ] Build classification function — given ticket subject + body, return category
- [ ] Call classification on ticket creation (in inbound-email route)
- [ ] Build knowledge base (markdown or DB table of common Q&A)
- [ ] Build reply suggestion function — given ticket + knowledge base, return draft reply
- [ ] API route: GET /api/tickets/[id]/suggest-reply — returns AI-generated draft
- [ ] Test classification accuracy across all three categories
- [ ] Test reply quality against sample tickets

---

## Phase 7 — Dashboard & Ticket List UI

- [ ] Build main layout (sidebar nav, header with user info + logout)
- [ ] Build dashboard page — summary counts (open, resolved, closed) by category
- [ ] Build ticket list page — table with columns: subject, category, status, date, sender
- [ ] Add filter controls: by status, by category
- [ ] Add sort controls: by date, by status
- [ ] Paginate ticket list

---

## Phase 8 — Ticket Detail UI

- [ ] Build ticket detail page — show full email body, metadata, status, category
- [ ] Show AI-suggested reply in an editable text area
- [ ] "Send Reply" button — calls reply API, updates ticket status to resolved
- [ ] "Close Ticket" button — updates status to closed
- [ ] Allow agent to manually change category
- [ ] Show reply history / thread if ticket has prior replies

---

## Phase 9 — Polish & Deployment

- [ ] Add form validation and error states across all pages
- [ ] Add loading states and empty states (no tickets, etc.)
- [ ] Make UI responsive (mobile-friendly)
- [ ] Set up Vercel project and connect repository
- [ ] Configure production environment variables in Vercel
- [ ] Run final end-to-end test in production environment
- [ ] Deploy and verify inbound email webhook is reachable
