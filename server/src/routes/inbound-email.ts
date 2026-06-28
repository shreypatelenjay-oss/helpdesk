import { Router } from "express";
import { inboundEmailSchema } from "@repo/core";
import prisma from "../lib/prisma";
import { requireWebhookSecret } from "../middleware/requireWebhookSecret";
import boss from "../lib/boss";
import { CLASSIFY_QUEUE } from "../lib/classifyTicket";

const router = Router();

router.post("/", requireWebhookSecret, async (req, res) => {
  const parsed = inboundEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { from, subject, text, html } = parsed.data;
  const body = text ?? html!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const ticket = await prisma.ticket.create({
    data: { senderEmail: from, subject, body },
    select: { id: true, subject: true, senderEmail: true, status: true, createdAt: true },
  });

  await boss.send(CLASSIFY_QUEUE, { ticketId: ticket.id, subject, body });

  res.status(201).json(ticket);
});

export default router;
