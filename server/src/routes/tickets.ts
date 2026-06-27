import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      senderEmail: true,
      status: true,
      category: true,
      createdAt: true,
      agent: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(tickets);
});

export default router;
