# Tech Stack

## Frontend
- **Next.js (React)** — dashboard, ticket views, and admin UI
- **Tailwind CSS** + **shadcn/ui** — styling and component library

## Backend
- **Next.js API routes** — ticket CRUD, user management, and AI calls
- **PostgreSQL** — relational database
- **Prisma** — type-safe ORM with migrations

## AI
- **Claude API (Anthropic)** — ticket classification and reply generation

## Email
- **SendGrid** or **Postmark** — inbound email parsing (webhook → ticket) and outbound reply sending

## Authentication
- **NextAuth.js** — credentials-based login for admin and agents
- **Database sessions** — sessions stored in PostgreSQL (not JWT); session table managed via Prisma

## Deployment
- **Vercel** — hosting for Next.js app
- **Supabase** or **Neon** — managed PostgreSQL
