import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    rateLimit: { window: 60, max: 5 },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BASE_URL ?? "http://localhost:8000",
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",") ?? (
    process.env.NODE_ENV === "production"
      ? (() => { throw new Error("TRUSTED_ORIGINS must be set in production"); })()
      : ["http://localhost:3000"]
  ),
  user: {
    additionalFields: {
      role: { type: "string", required: false, input: false },
    },
  },
});
