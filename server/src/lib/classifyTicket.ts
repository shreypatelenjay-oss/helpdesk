import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import * as Sentry from "@sentry/node";
import type { Job } from "pg-boss";
import { isQuotaError } from "./aiErrors";
import prisma from "./prisma";

export const CLASSIFY_QUEUE = "classify-ticket";

const VALID_CATEGORIES = ["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

export interface ClassifyTicketJob {
  ticketId: string;
  subject: string;
  body: string;
}

export async function classifyTicketWorker([job]: Job<ClassifyTicketJob>[]) {
  const { ticketId, subject, body } = job.data;

  let text: string;
  try {
    ({ text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Classify this support ticket into exactly one of these categories: GENERAL_QUESTION, TECHNICAL_QUESTION, REFUND_REQUEST.

Subject: ${subject}
Body: ${body}

Reply with only the category name, nothing else.`,
    }));
  } catch (err) {
    const quotaExceeded = isQuotaError(err);
    console.error(`[classifyTicket] generateText failed for ticket ${ticketId}${quotaExceeded ? " (quota exceeded)" : ""}:`, err);
    Sentry.captureException(err, { tags: { worker: "classifyTicket", quotaExceeded }, extra: { ticketId } });
    throw err;
  }

  const category = text.trim() as Category;
  if (!VALID_CATEGORIES.includes(category)) {
    console.warn(`[classifyTicket] unexpected category "${category}" for ticket ${ticketId}`);
    return;
  }

  await prisma.ticket.update({ where: { id: ticketId }, data: { category } });
}
