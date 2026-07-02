import prisma from "./prisma";
import boss from "./boss";
import { CLASSIFY_QUEUE } from "./classifyTicket";
import { AUTO_RESOLVE_QUEUE } from "./autoResolveTicket";

export async function createTicketFromEmail({
  from,
  subject,
  text,
  html,
}: {
  from: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const body = text ?? html!.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const ticket = await prisma.ticket.create({
    data: { senderEmail: from, subject, body },
    select: { id: true, subject: true, senderEmail: true, status: true, createdAt: true },
  });

  await boss.send(CLASSIFY_QUEUE, { ticketId: ticket.id, subject, body });
  await boss.send(AUTO_RESOLVE_QUEUE, { ticketId: ticket.id, subject, body });

  return ticket;
}
