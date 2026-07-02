import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  const rows = await prisma.$queryRaw<
    [{
      totalTickets: bigint;
      openTickets: bigint;
      aiResolvedTickets: bigint;
      aiResolvedPercent: number;
      avgResolutionMs: number | null;
    }]
  >`SELECT * FROM get_ticket_stats()`;

  const r = rows[0];
  res.json({
    totalTickets: Number(r.totalTickets),
    openTickets: Number(r.openTickets),
    aiResolvedTickets: Number(r.aiResolvedTickets),
    aiResolvedPercent: r.aiResolvedPercent,
    avgResolutionMs: r.avgResolutionMs,
  });
});

router.get("/tickets-per-day", async (_req, res) => {
  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT * FROM get_tickets_per_day()
  `;
  res.json(rows.map((r) => ({ date: r.date, count: Number(r.count) })));
});

export default router;
