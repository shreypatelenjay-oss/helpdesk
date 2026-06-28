import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import prisma from "./prisma";

const VALID_CATEGORIES = ["GENERAL_QUESTION", "TECHNICAL_QUESTION", "REFUND_REQUEST"] as const;
type Category = (typeof VALID_CATEGORIES)[number];

export function classifyTicket(ticketId: string, subject: string, body: string): void {
  const prompt = `Classify this support ticket into exactly one of these categories: GENERAL_QUESTION, TECHNICAL_QUESTION, REFUND_REQUEST.

Subject: ${subject}
Body: ${body}

Reply with only the category name, nothing else.`;

  generateText({ model: google("gemini-2.5-flash"), prompt })
    .then(({ text }) => {
      const category = text.trim() as Category;
      if (!VALID_CATEGORIES.includes(category)) return;
      return prisma.ticket.update({ where: { id: ticketId }, data: { category } });
    })
    .catch((err) => {
      console.error(`[classifyTicket] failed for ticket ${ticketId}:`, err);
    });
}
