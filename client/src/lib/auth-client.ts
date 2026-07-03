import { createAuthClient } from "better-auth/react";

// VITE_API_URL is only set for cross-origin deployments (client on Vercel, server elsewhere) —
// same-origin deployments (Railway/Docker) leave it unset and rely on the relative default.
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  fetchOptions: { credentials: "include" },
});
