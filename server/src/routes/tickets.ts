import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

const SORTABLE_COLUMNS = ["subject", "senderEmail", "status", "category", "createdAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

router.get("/", async (req, res) => {
  const { sortBy, sortDir } = req.query as { sortBy?: string; sortDir?: string };

  const column: SortableColumn = SORTABLE_COLUMNS.includes(sortBy as SortableColumn)
    ? (sortBy as SortableColumn)
    : "createdAt";
  const direction = sortDir === "asc" ? "asc" : "desc";

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
    orderBy: { [column]: direction },
  });
  res.json(tickets);
});

export default router;
