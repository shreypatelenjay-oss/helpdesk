import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    ...(process.env.NODE_ENV === "production" && { rateLimit: { window: 60, max: 5 } }),
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
  // SameSite=None + Secure lets the session cookie work when the client and server are on
  // different origins (e.g. client on Vercel, server on Railway/Vercel) — required cross-site,
  // and harmless same-origin. Guarded to production since Secure cookies need HTTPS.
  ...(process.env.NODE_ENV === "production" && {
    advanced: { defaultCookieAttributes: { sameSite: "none", secure: true } },
  }),
});
