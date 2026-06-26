import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import prisma from "./lib/prisma";

const app = express();
const PORT = process.env.PORT ?? 8000;

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "ok", db: "disconnected" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
