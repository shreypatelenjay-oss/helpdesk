import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { Role } from "@repo/core";

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

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      body: true,
      senderEmail: true,
      status: true,
      category: true,
      createdAt: true,
      assignedTo: true,
      agent: { select: { id: true, name: true, email: true } },
      replies: { orderBy: { sentAt: "asc" } },
    },
  });

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  res.json(ticket);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status, category, assignedTo } = req.body;

  // Validate status if provided
  if (status && !["OPEN", "RESOLVED", "CLOSED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  let categoryVal: any = undefined;
  if (category !== undefined) {
    if (category === "UNASSIGNED" || category === null) {
      categoryVal = null;
    } else if (["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"].includes(category)) {
      categoryVal = category;
    } else {
      return res.status(400).json({ error: "Invalid category value" });
    }
  }

  let assignedToVal: string | null | undefined = undefined;
  if (assignedTo !== undefined) {
    if (assignedTo === "UNASSIGNED" || assignedTo === null) {
      assignedToVal = null;
    } else {
      assignedToVal = assignedTo;
      // verify agent exists
      const user = await prisma.user.findUnique({ where: { id: assignedTo } });
      if (!user || user.deletedAt || user.role !== Role.AGENT) {
        return res.status(400).json({ error: "Assigned agent not found" });
      }
    }
  }

  // Check if ticket exists
  const ticketExists = await prisma.ticket.findUnique({ where: { id } });
  if (!ticketExists) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const data: any = {};
  if (status !== undefined) data.status = status;
  if (categoryVal !== undefined) data.category = categoryVal;
  if (assignedToVal !== undefined) data.assignedTo = assignedToVal;

  const updatedTicket = await prisma.ticket.update({
    where: { id },
    data,
    select: {
      id: true,
      subject: true,
      body: true,
      senderEmail: true,
      status: true,
      category: true,
      createdAt: true,
      assignedTo: true,
      agent: { select: { id: true, name: true, email: true } },
    },
  });

  res.json(updatedTicket);
});

export default router;
