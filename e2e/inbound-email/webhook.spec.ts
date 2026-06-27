import { test, expect } from "@playwright/test";
import { postWebhook } from "../helpers/api";

const VALID_PAYLOAD = {
  from: "customer@example.com",
  subject: "I need help with my order",
  text: "Hello, I have a question about my recent order.",
};

test.describe("POST /api/inbound-email", () => {
  // -------------------------------------------------------------------------
  // Happy paths
  // -------------------------------------------------------------------------

  test("valid request with text body returns 201 with correct fields", async ({
    request,
  }) => {
    const response = await postWebhook(request, VALID_PAYLOAD);

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({
      subject: VALID_PAYLOAD.subject,
      senderEmail: VALID_PAYLOAD.from,
      status: "OPEN",
    });
    expect(body.id).toBeTruthy();
    expect(body.createdAt).toBeTruthy();
  });

  test("valid request with html-only body returns 201", async ({ request }) => {
    const response = await postWebhook(request, {
      from: "customer@example.com",
      subject: "HTML-only email",
      html: "<p>I need a refund for order #1234.</p>",
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({
      subject: "HTML-only email",
      senderEmail: "customer@example.com",
      status: "OPEN",
    });
    expect(body.id).toBeTruthy();
  });

  test("valid request with both text and html uses text body", async ({
    request,
  }) => {
    const response = await postWebhook(request, {
      from: "customer@example.com",
      subject: "Both text and html",
      text: "Plain text version.",
      html: "<p>HTML version.</p>",
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.status).toBe("OPEN");
  });

  // -------------------------------------------------------------------------
  // Auth failures — missing or wrong secret
  // -------------------------------------------------------------------------

  test("missing x-webhook-secret header returns 401", async ({ request }) => {
    const response = await request.post("http://localhost:8000/api/inbound-email", {
      data: VALID_PAYLOAD,
    });

    expect(response.status()).toBe(401);
  });

  test("wrong x-webhook-secret value returns 401", async ({ request }) => {
    const response = await postWebhook(request, VALID_PAYLOAD, "not-the-right-secret");

    expect(response.status()).toBe(401);
  });

  // -------------------------------------------------------------------------
  // Validation failures — bad request body
  // -------------------------------------------------------------------------

  test("missing both text and html returns 400", async ({ request }) => {
    const response = await postWebhook(request, {
      from: "customer@example.com",
      subject: "No body at all",
    });

    expect(response.status()).toBe(400);
  });

  test("invalid from email returns 400", async ({ request }) => {
    const response = await postWebhook(request, {
      from: "not-a-valid-email",
      subject: "Bad sender",
      text: "Some body text.",
    });

    expect(response.status()).toBe(400);
  });

  test("empty subject returns 400", async ({ request }) => {
    const response = await postWebhook(request, {
      from: "customer@example.com",
      subject: "",
      text: "Some body text.",
    });

    expect(response.status()).toBe(400);
  });

  // -------------------------------------------------------------------------
  // Persistence — verifying tickets are actually stored
  //
  // NOTE: There is no GET /api/tickets endpoint yet (only /api/inbound-email
  // and /api/users are mounted). Until that route exists, persistence is
  // verified through the response contract of POST itself:
  //   • A unique `id` (UUID) is returned — the DB row was created and its PK
  //     echoed back.
  //   • Sequential POSTs produce distinct IDs — the DB is not deduplicating or
  //     returning a cached object.
  //   • Payload fields are round-tripped correctly in the response — the ORM
  //     wrote and read the row back before responding.
  //
  // When GET /api/tickets is available, replace these with tests that call
  // getTickets() from e2e/helpers/api.ts and assert the row is present there.
  // -------------------------------------------------------------------------

  test("created ticket has a unique cuid-shaped id", async ({ request }) => {
    const response = await postWebhook(request, VALID_PAYLOAD);

    expect(response.status()).toBe(201);
    const body = await response.json();

    // Prisma uses cuid2: starts with a lowercase letter, alphanumeric, 24+ chars
    expect(body.id).toMatch(/^[a-z][a-z0-9]{23,}$/);
  });

  test("two sequential POSTs produce two distinct ticket IDs", async ({
    request,
  }) => {
    const [res1, res2] = await Promise.all([
      postWebhook(request, {
        from: "alice@example.com",
        subject: "First ticket",
        text: "First message body.",
      }),
      postWebhook(request, {
        from: "bob@example.com",
        subject: "Second ticket",
        text: "Second message body.",
      }),
    ]);

    expect(res1.status()).toBe(201);
    expect(res2.status()).toBe(201);

    const [body1, body2] = await Promise.all([res1.json(), res2.json()]);

    // If the server were returning a cached or singleton object both ids
    // would be the same — distinct ids confirm two separate DB rows.
    expect(body1.id).toBeTruthy();
    expect(body2.id).toBeTruthy();
    expect(body1.id).not.toBe(body2.id);
  });

  test("response body round-trips the sender email stored in the DB", async ({
    request,
  }) => {
    const senderEmail = "persistence-check@example.com";

    const response = await postWebhook(request, {
      from: senderEmail,
      subject: "Persistence check",
      text: "Verifying senderEmail is written and echoed back correctly.",
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    // The server reads the created row from the DB before returning it.
    // A mismatch here means the ORM write or the SELECT-back failed.
    expect(body.senderEmail).toBe(senderEmail);
  });

  test("response body round-trips the subject stored in the DB", async ({
    request,
  }) => {
    const subject = "Unique subject for persistence round-trip";

    const response = await postWebhook(request, {
      from: "customer@example.com",
      subject,
      text: "Body text.",
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.subject).toBe(subject);
  });

  test("newly created ticket has status OPEN in the DB response", async ({
    request,
  }) => {
    const response = await postWebhook(request, {
      from: "new-ticket@example.com",
      subject: "Status check on create",
      text: "Should default to OPEN.",
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    // Tickets must default to OPEN on creation — any other value indicates
    // the DB default or the application logic is broken.
    expect(body.status).toBe("OPEN");
  });

  test("createdAt timestamp in response is a valid ISO date close to now", async ({
    request,
  }) => {
    const before = Date.now();

    const response = await postWebhook(request, {
      from: "timestamp@example.com",
      subject: "Timestamp check",
      text: "Checking createdAt is set by the DB.",
    });

    const after = Date.now();

    expect(response.status()).toBe(201);
    const body = await response.json();

    const created = new Date(body.createdAt).getTime();
    // The DB-generated timestamp must fall within the window of this test run.
    expect(created).toBeGreaterThanOrEqual(before - 5000); // 5s tolerance for clock skew
    expect(created).toBeLessThanOrEqual(after + 5000);
  });
});
