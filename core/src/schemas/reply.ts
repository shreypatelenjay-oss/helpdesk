import { z } from "zod";

export const createReplySchema = z.object({
  body: z.string().min(1, "Reply cannot be empty").max(5000, "Reply cannot exceed 5000 characters"),
  bodyHTML: z.string().max(50000).nullable().optional(),
});

export const polishReplySchema = z.object({
  body: z.string().min(1, "Reply cannot be empty").max(5000, "Reply cannot exceed 5000 characters"),
});
