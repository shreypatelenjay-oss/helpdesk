import { NextFunction, Request, Response } from "express";

// Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` when a project
// env var named CRON_SECRET is set, so this doubles as the shared secret check.
export function requireCronSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ error: "CRON_SECRET is not configured" });
    return;
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
