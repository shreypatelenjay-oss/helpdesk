import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { Role, createReplySchema, polishReplySchema } from "@repo/core";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { sendReplyEmail } from "../lib/mailer";

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

  const where: any = {
    status: { notIn: ["NEW", "PROCESSING"] },
  };

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
      replies: { select: { id: true, body: true, bodyHTML: true, senderType: true, sentAt: true }, orderBy: { sentAt: "asc" } },
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

router.post("/polish-reply", async (req, res) => {
  const parsed = polishReplySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const agentName = (req as any).user?.name ?? "Agent";

  const { text } = await generateText({
    model: google("gemini-2.5-flash-lite"),
    prompt: `You are a support agent assistant. Improve the following draft reply to make it clearer, more professional, and empathetic. End the reply with a sign-off using the agent's name "${agentName}". Return only the improved reply text with no preamble, explanation, or quotation marks.\n\nDraft:\n${parsed.data.body}`,
  });

  res.json({ polished: text.trim() });
});

router.post("/:id/summarize", async (req, res) => {
  const { id } = req.params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: {
      subject: true,
      body: true,
      senderEmail: true,
      replies: { select: { body: true, senderType: true, sentAt: true }, orderBy: { sentAt: "asc" } },
    },
  });

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const conversation = ticket.replies
    .map((r) => `[${r.senderType === "AGENT" ? "Agent" : "Customer"} at ${new Date(r.sentAt).toLocaleString()}]: ${r.body}`)
    .join("\n\n");

  const prompt = `You are a support ticket summarizer. Summarize the following support ticket and its conversation history in 2–4 concise sentences. Focus on: what the customer's issue is, what has been done so far, and the current status.

Ticket subject: ${ticket.subject}
From: ${ticket.senderEmail}

Original message:
${ticket.body}

${conversation ? `Conversation:\n${conversation}` : "No replies yet."}

Provide only the summary, with no preamble.`;

  const { text } = await generateText({
    model: google("gemini-2.5-flash-lite"),
    prompt,
  });

  res.json({ summary: text.trim() });
});

router.post("/:id/reply", async (req, res) => {
  const { id } = req.params;

  const parsed = createReplySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const reply = await prisma.reply.create({
    data: { ticketId: id, body: parsed.data.body, bodyHTML: parsed.data.bodyHTML ?? null, senderType: "AGENT" },
    select: { id: true, body: true, bodyHTML: true, senderType: true, sentAt: true },
  });

  await sendReplyEmail({
    to: ticket.senderEmail,
    subject: ticket.subject,
    text: parsed.data.body,
    html: parsed.data.bodyHTML ?? undefined,
  });

  res.status(201).json(reply);
});

export default router;
