import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import prisma from "./lib/prisma";

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(helmet());

// better-auth handles its own body parsing, so auth routes are mounted before express.json()
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true });
app.all("/api/auth/*splat", authLimiter, toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", db: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
