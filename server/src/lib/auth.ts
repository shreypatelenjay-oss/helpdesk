import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BASE_URL ?? "http://localhost:8000",
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",") ?? ["http://localhost:3000"],
  user: {
    additionalFields: {
      role: { type: "string", required: false },
    },
  },
});
