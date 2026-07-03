import prisma from "./prisma";
import boss from "./boss";
import { CLASSIFY_QUEUE } from "./classifyTicket";
import { AUTO_RESOLVE_QUEUE } from "./autoResolveTicket";

const TICKET_REPLY_TAG_RE = /\+ticket-([a-z0-9]+)@/i;

function normalizeSubject(subject: string): string {
  let normalized = subject.trim().toLowerCase();
  let previous: string;
  do {
    previous = normalized;
    normalized = normalized.replace(/^(re|fwd?):\s*/i, "").trim();
  } while (normalized !== previous);
  return normalized;
}

async function findThreadedTicket(from: string, subject: string, to?: string) {
  const taggedId = to?.match(TICKET_REPLY_TAG_RE)?.[1];
  if (taggedId) {
    const tagged = await prisma.ticket.findUnique({ where: { id: taggedId } });
    if (tagged) return tagged;
  }

  const normalized = normalizeSubject(subject);
  return prisma.ticket.findFirst({
    where: { senderEmail: from, status: { not: "CLOSED" }, subject: { equals: normalized, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTicketFromEmail({
  from,
  subject,
  text,
  html,
  to,
}: {
  from: string;
  subject: string;
  text?: string;
  html?: string;
  to?: string;
}) {
  const body = text ?? html!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const existingTicket = await findThreadedTicket(from, subject, to);
  if (existingTicket) {
    const [reply] = await prisma.$transaction([
      prisma.reply.create({
        data: { ticketId: existingTicket.id, body, senderType: "CUSTOMER" },
      }),
      prisma.ticket.update({
        where: { id: existingTicket.id },
        data: { status: "OPEN", resolvedByAI: false, resolvedAt: null },
      }),
    ]);

    const priorReplies = await prisma.reply.findMany({
      where: { ticketId: existingTicket.id },
      orderBy: { sentAt: "asc" },
      select: { body: true, senderType: true },
    });
    const conversation = priorReplies
      .map((r) => `[${r.senderType === "AGENT" ? "Agent" : "Customer"}]: ${r.body}`)
      .join("\n\n");

    await boss.send(AUTO_RESOLVE_QUEUE, {
      ticketId: existingTicket.id,
      subject: existingTicket.subject,
      body: `${existingTicket.body}\n\n${conversation}`,
    });

    return { ...existingTicket, status: "OPEN" as const, lastReplyId: reply.id };
  }

  const ticket = await prisma.ticket.create({
    data: { senderEmail: from, subject, body },
    select: { id: true, subject: true, senderEmail: true, status: true, createdAt: true },
  });

  await boss.send(CLASSIFY_QUEUE, { ticketId: ticket.id, subject, body });
  await boss.send(AUTO_RESOLVE_QUEUE, { ticketId: ticket.id, subject, body });

  return ticket;
}

function firstAddress(headerValue?: string): string | undefined {
  return headerValue?.match(/[^\s<>,]+@[^\s<>,]+/)?.[0];
}

async function findTicketForAgentReply(to: string | undefined, subject: string) {
  const taggedId = to?.match(TICKET_REPLY_TAG_RE)?.[1];
  if (taggedId) {
    const tagged = await prisma.ticket.findUnique({ where: { id: taggedId } });
    if (tagged) return tagged;
  }

  const customerEmail = firstAddress(to);
  if (!customerEmail) return null;

  const normalized = normalizeSubject(subject);
  return prisma.ticket.findFirst({
    where: { senderEmail: customerEmail, subject: { equals: normalized, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
  });
}

// Handles replies an agent composed directly in Gmail (bypassing the app's reply box), found via
// the Sent folder. Only logs the reply against a matching ticket — never creates a new ticket, and
// never touches status/assignment/queues, since a human is already handling it out-of-band.
export async function syncAgentReplyFromEmail({
  to,
  subject,
  text,
  html,
}: {
  to?: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const body = text ?? (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : undefined);
  if (!body) return;

  const ticket = await findTicketForAgentReply(to, subject);
  if (!ticket) return;

  await prisma.reply.create({
    data: { ticketId: ticket.id, body, senderType: "AGENT" },
  });
}
