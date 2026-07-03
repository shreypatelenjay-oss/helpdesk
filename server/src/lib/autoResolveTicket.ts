import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import * as Sentry from "@sentry/node";
import { readFileSync } from "fs";
import { join } from "path";
import type { Job } from "pg-boss";
import { getAIAgent } from "./aiAgent";
import { isQuotaError } from "./aiErrors";
import { sendReplyEmail } from "./mailer";
import prisma from "./prisma";

export const AUTO_RESOLVE_QUEUE = "auto-resolve-ticket";

export interface AutoResolveTicketJob {
  ticketId: string;
  subject: string;
  body: string;
}

const knowledgeBase = readFileSync(
  join(import.meta.dir, "../../knowledge-base.md"),
  "utf-8"
);

function firstNameFromEmail(email: string): string {
  const local = email.split("@")[0];
  const part = local.split(/[._+]/)[0];
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export async function autoResolveTicketWorker([job]: Job<AutoResolveTicketJob>[]) {
  const { ticketId, subject, body } = job.data;

  const aiAgent = await getAIAgent();

  const existing = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    select: { assignedTo: true },
  });

  // A human agent already owns this ticket — don't let the AI hijack it out from under them.
  if (existing.assignedTo && existing.assignedTo !== aiAgent.id) {
    return;
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "PROCESSING", assignedTo: aiAgent.id },
    select: { senderEmail: true },
  });

  const customerFirstName = firstNameFromEmail(ticket.senderEmail);

  let text: string;
  try {
    ({ text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `You are a professional support agent for an online learning platform called Code with Mosh. Use the knowledge base below to determine if you can fully resolve this customer support ticket.

KNOWLEDGE BASE:
${knowledgeBase}

CUSTOMER NAME: ${customerFirstName}
TICKET SUBJECT: ${subject}
TICKET BODY: ${body}

Respond with valid JSON only, no markdown. If the knowledge base contains a clear answer, set canResolve to true and write the reply in the reply field. If any of the following escalation conditions apply, set canResolve to false: legal threat, chargeback or payment dispute, refund request outside the 30-day window, account security concern, or low confidence in your answer.

Reply writing rules (apply only when canResolve is true):
- Open with "Hi [customer first name],"
- Use a warm, professional, customer-friendly tone
- Use short paragraphs with a blank line between each
- End with a closing line such as "Please don't hesitate to reach out if you have any other questions."
- Sign off with:
  Best regards,
  Admin Support

{"canResolve": boolean, "reply": string}`,
    }));
  } catch (err) {
    const quotaExceeded = isQuotaError(err);
    console.error(`[autoResolveTicket] generateText failed for ticket ${ticketId}${quotaExceeded ? " (quota exceeded)" : ""}:`, err);
    Sentry.captureException(err, { tags: { worker: "autoResolveTicket", quotaExceeded }, extra: { ticketId } });
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: "OPEN", assignedTo: null } });
    return;
  }

  // Gemini sometimes wraps the JSON in a markdown code fence despite the prompt saying not to.
  const jsonText = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let parsed: { canResolve: boolean; reply: string };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    console.warn(`[autoResolveTicket] failed to parse AI response for ticket ${ticketId}:`, text);
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: "OPEN", assignedTo: null } });
    return;
  }

  if (!parsed.canResolve) {
    await prisma.ticket.update({ where: { id: ticketId }, data: { status: "OPEN", assignedTo: null } });
    return;
  }

  await prisma.$transaction([
    prisma.reply.create({
      data: { ticketId, body: parsed.reply, senderType: "AGENT" },
    }),
    prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "RESOLVED", resolvedByAI: true, resolvedAt: new Date() },
    }),
  ]);

  await sendReplyEmail({
    to: ticket.senderEmail,
    subject,
    text: parsed.reply,
    ticketId,
  });
}
