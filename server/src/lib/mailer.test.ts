import { describe, test, expect, mock, beforeEach } from "bun:test";

const fetchMock = mock(() => Promise.resolve(new Response("{}", { status: 200 })));
globalThis.fetch = fetchMock as unknown as typeof fetch;

process.env.GMAIL_USER = "sender@gmail.com";
process.env.GMAIL_APP_PASSWORD = "test-app-password";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.RESEND_FROM_EMAIL = "onboarding@resend.dev";

const { sendReplyEmail } = await import("./mailer");

function lastRequestBody() {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string);
}

describe("sendReplyEmail", () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  test("prefixes subject with 'Re: ' when missing", async () => {
    await sendReplyEmail({ to: "customer@example.com", subject: "Password reset", text: "Here you go" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastRequestBody().subject).toBe("Re: Password reset");
  });

  test("does not double-prefix a subject that already starts with 'Re:'", async () => {
    await sendReplyEmail({ to: "customer@example.com", subject: "Re: Password reset", text: "Here you go" });

    expect(lastRequestBody().subject).toBe("Re: Password reset");
  });

  test("sends from RESEND_FROM_EMAIL, to the given recipient, with text and html", async () => {
    await sendReplyEmail({
      to: "customer@example.com",
      subject: "Ticket update",
      text: "plain body",
      html: "<p>html body</p>",
    });

    const body = lastRequestBody();
    expect(body.from).toBe("onboarding@resend.dev");
    expect(body.to).toBe("customer@example.com");
    expect(body.text).toBe("plain body");
    expect(body.html).toBe("<p>html body</p>");
  });

  test("sets a plus-addressed Reply-To for the ticket so inbound replies can be threaded", async () => {
    await sendReplyEmail({
      to: "customer@example.com",
      subject: "Ticket update",
      text: "plain body",
      ticketId: "cmticket42",
    });

    const body = lastRequestBody();
    expect(body.reply_to).toBe("sender+ticket-cmticket42@gmail.com");
  });

  test("omits Reply-To when no ticketId is given", async () => {
    await sendReplyEmail({ to: "customer@example.com", subject: "Ticket update", text: "plain body" });

    expect(lastRequestBody().reply_to).toBeUndefined();
  });

  test("marks the email so Sent-folder polling can recognize it as already-synced", async () => {
    await sendReplyEmail({ to: "customer@example.com", subject: "Ticket update", text: "plain body" });

    expect(lastRequestBody().headers).toEqual({ "X-Helpdesk-App-Reply": "1" });
  });

  test("throws when Resend responds with a non-ok status", async () => {
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response("bad request", { status: 400 })));

    await expect(
      sendReplyEmail({ to: "customer@example.com", subject: "Ticket update", text: "plain body" })
    ).rejects.toThrow(/Resend send failed/);
  });
});
