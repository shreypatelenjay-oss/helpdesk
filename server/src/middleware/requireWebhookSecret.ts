import { Request, Response, NextFunction } from "express";

export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  const provided = req.headers["x-webhook-secret"];
  if (!secret || !provided || provided !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
