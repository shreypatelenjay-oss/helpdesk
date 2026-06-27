import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.use(requireAuth);

const SORTABLE_COLUMNS = ["subject", "senderEmail", "status", "category", "createdAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

router.get("/", async (req, res) => {
  const { sortBy, sortDir, status, category, assignedTo, search, page, pageSize } = req.query as {
    sortBy?: string;
    sortDir?: string;
    status?: string;
    category?: string;
    assignedTo?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  };

  const column: SortableColumn = SORTABLE_COLUMNS.includes(sortBy as SortableColumn)
    ? (sortBy as SortableColumn)
    : "createdAt";
  const direction = sortDir === "asc" ? "asc" : "desc";

  const pageNum = Math.max(1, parseInt(page || "") || 1);
  const pageSizeNum = Math.max(1, parseInt(pageSize || "") || 10);

  const where: any = {};

  if (status && ["OPEN", "RESOLVED", "CLOSED"].includes(status)) {
    where.status = status;
  }

  if (category) {
    if (category === "UNASSIGNED") {
      where.category = null;
    } else if (["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"].includes(category)) {
      where.category = category;
    }
  }

  if (assignedTo) {
    if (assignedTo === "UNASSIGNED") {
      where.assignedTo = null;
    } else {
      where.assignedTo = assignedTo;
    }
  }

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
      { senderEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [totalCount, tickets] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
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
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
    }),
  ]);

  res.json({
    tickets,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSizeNum),
    page: pageNum,
    pageSize: pageSizeNum,
  });
});

export default router;
