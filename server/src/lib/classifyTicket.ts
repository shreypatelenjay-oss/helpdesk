import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { Job } from "pg-boss";
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

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `Classify this support ticket into exactly one of these categories: GENERAL_QUESTION, TECHNICAL_QUESTION, REFUND_REQUEST.

Subject: ${subject}
Body: ${body}

Reply with only the category name, nothing else.`,
  });

  const category = text.trim() as Category;
  if (!VALID_CATEGORIES.includes(category)) {
    console.warn(`[classifyTicket] unexpected category "${category}" for ticket ${ticketId}`);
    return;
  }

  await prisma.ticket.update({ where: { id: ticketId }, data: { category } });
}
