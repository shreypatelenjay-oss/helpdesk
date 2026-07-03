import "./lib/sentry";
import * as Sentry from "@sentry/node";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { auth } from "./lib/auth";
import prisma from "./lib/prisma";
import usersRouter from "./routes/users";
import inboundEmailRouter from "./routes/inbound-email";
import ticketsRouter from "./routes/tickets";
import statsRouter from "./routes/stats";
import cronRouter from "./routes/cron";
import { requireAuth } from "./middleware/requireAuth";

if (!process.env.INBOUND_EMAIL_SECRET) {
  const msg = "INBOUND_EMAIL_SECRET is not set";
  if (process.env.NODE_ENV === "production") throw new Error(msg);
  else console.warn(`[WARN] ${msg} — webhook endpoint will reject all requests`);
}

const app = express();

// CORS for cross-origin deployments (client on Vercel, server elsewhere). Same-origin
// deployments (Railway/Docker) never see a request `Origin` header that mismatches, so this
// is a no-op there. Credentials must be echoed per-origin (not "*") for cookies to work.
const trustedOrigins = process.env.TRUSTED_ORIGINS?.split(",") ?? [];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && trustedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(204);
    return;
  }
  next();
});

// Helmet's default Cross-Origin-Resource-Policy is same-origin, which blocks the browser from
// reading responses on cross-origin deployments even when CORS headers above allow it.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// better-auth handles its own body parsing, so auth routes are mounted before express.json()
const middlewares = process.env.NODE_ENV === "production"
  ? [rateLimit({ windowMs: 15 * 60_000, max: 20, standardHeaders: true }), toNodeHandler(auth)]
  : [toNodeHandler(auth)];
app.all("/api/auth/*splat", ...middlewares);

app.use(express.json());

app.use("/api/inbound-email", inboundEmailRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/users", usersRouter);
app.use("/api/stats", requireAuth, statsRouter);
app.use("/api/cron", cronRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", db: "disconnected" });
  }
});

// On Vercel the client is deployed as a separate static project, so there's no client/dist to serve.
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  const clientDist = path.join(dirname(fileURLToPath(import.meta.url)), "../../client/dist");
  app.use(express.static(clientDist));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

Sentry.setupExpressErrorHandler(app);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
