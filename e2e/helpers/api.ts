import { APIRequestContext } from "@playwright/test";

const SERVER_URL = process.env.BASE_URL ?? "http://localhost:8000";

export function postWebhook(
  request: APIRequestContext,
  data: Record<string, unknown>,
  secret = process.env.INBOUND_EMAIL_SECRET
) {
  if (!secret) throw new Error("INBOUND_EMAIL_SECRET is not set in the test environment");
  return request.post(`${SERVER_URL}/api/inbound-email`, {
    headers: { "x-webhook-secret": secret },
    data,
  });
}

// No GET /api/tickets endpoint exists yet (only /api/users and /api/inbound-email
// are mounted in server/src/index.ts). When a tickets read route is added,
// implement this helper and wire it into the persistence tests below.
export async function getTickets(
  request: APIRequestContext,
  adminSession: string
): Promise<{ id: string; subject: string; senderEmail: string; status: string }[]> {
  throw new Error(
    "GET /api/tickets is not yet implemented — add the route first, then update this helper"
  );
}
