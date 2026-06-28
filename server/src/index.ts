import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import prisma from "./lib/prisma";
import usersRouter from "./routes/users";
import inboundEmailRouter from "./routes/inbound-email";
import ticketsRouter from "./routes/tickets";
import { requireAuth } from "./middleware/requireAuth";
import boss from "./lib/boss";
import { CLASSIFY_QUEUE, classifyTicketWorker } from "./lib/classifyTicket";

if (!process.env.INBOUND_EMAIL_SECRET) {
  const msg = "INBOUND_EMAIL_SECRET is not set";
  if (process.env.NODE_ENV === "production") throw new Error(msg);
  else console.warn(`[WARN] ${msg} — webhook endpoint will reject all requests`);
}

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(helmet());

// better-auth handles its own body parsing, so auth routes are mounted before express.json()
const middlewares = process.env.NODE_ENV === "production"
  ? [rateLimit({ windowMs: 15 * 60_000, max: 20, standardHeaders: true }), toNodeHandler(auth)]
  : [toNodeHandler(auth)];
app.all("/api/auth/*splat", ...middlewares);

app.use(express.json());

app.use("/api/inbound-email", inboundEmailRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", db: "disconnected" });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

boss.start().then(async () => {
  await boss.createQueue(CLASSIFY_QUEUE);
  await boss.work(CLASSIFY_QUEUE, classifyTicketWorker);
  console.log("[pg-boss] worker ready");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
