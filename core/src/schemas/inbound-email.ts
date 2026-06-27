import { z } from "zod";

export const inboundEmailSchema = z
  .object({
    from: z.string().email(),
    subject: z.string().min(1),
    text: z.string().optional(),
    html: z.string().optional(),
  })
  .refine((data) => data.text !== undefined || data.html !== undefined, {
    message: "Either 'text' or 'html' must be provided",
  });

export type InboundEmail = z.infer<typeof inboundEmailSchema>;
