import { Router } from "express";
import { inboundEmailSchema } from "@repo/core";
import { requireWebhookSecret } from "../middleware/requireWebhookSecret";
import { createTicketFromEmail } from "../lib/createTicketFromEmail";

const router = Router();

router.post("/", requireWebhookSecret, async (req, res) => {
  const parsed = inboundEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const ticket = await createTicketFromEmail(parsed.data);

  res.status(201).json(ticket);
});

export default router;
