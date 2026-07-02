import { describe, test, expect, mock, beforeEach } from "bun:test";

const ticketCreate = mock((args: any) =>
  Promise.resolve({
    id: "ticket-1",
    subject: args.data.subject,
    senderEmail: args.data.senderEmail,
    status: "NEW",
    createdAt: new Date(),
  })
);
const bossSend = mock(() => Promise.resolve());

mock.module("./prisma", () => ({
  default: { ticket: { create: ticketCreate } },
}));
mock.module("./boss", () => ({
  default: { send: bossSend },
}));

const { createTicketFromEmail } = await import("./createTicketFromEmail");
const { CLASSIFY_QUEUE } = await import("./classifyTicket");
const { AUTO_RESOLVE_QUEUE } = await import("./autoResolveTicket");

describe("createTicketFromEmail", () => {
  beforeEach(() => {
    ticketCreate.mockClear();
    bossSend.mockClear();
  });

  test("uses the plain text body when provided", async () => {
    await createTicketFromEmail({
      from: "student@example.com",
      subject: "Need help",
      text: "I need help resetting my password.",
      html: "<p>ignored</p>",
    });

    const arg = ticketCreate.mock.calls[0][0];
    expect(arg.data.body).toBe("I need help resetting my password.");
    expect(arg.data.senderEmail).toBe("student@example.com");
    expect(arg.data.subject).toBe("Need help");
  });

  test("strips HTML tags and collapses whitespace when only html is provided", async () => {
    await createTicketFromEmail({
      from: "student@example.com",
      subject: "Need help",
      html: "<p>Hello   <b>there</b></p>\n<p>Second line</p>",
    });

    const arg = ticketCreate.mock.calls[0][0];
    expect(arg.data.body).toBe("Hello there Second line");
  });

  test("enqueues classify and auto-resolve jobs with the created ticket id", async () => {
    const ticket = await createTicketFromEmail({
      from: "student@example.com",
      subject: "Need help",
      text: "body text",
    });

    expect(bossSend).toHaveBeenCalledTimes(2);
    expect(bossSend.mock.calls[0]).toEqual([CLASSIFY_QUEUE, { ticketId: ticket.id, subject: "Need help", body: "body text" }]);
    expect(bossSend.mock.calls[1]).toEqual([AUTO_RESOLVE_QUEUE, { ticketId: ticket.id, subject: "Need help", body: "body text" }]);
  });

  test("returns the created ticket", async () => {
    const ticket = await createTicketFromEmail({
      from: "student@example.com",
      subject: "Need help",
      text: "body text",
    });

    expect(ticket).toEqual({
      id: "ticket-1",
      subject: "Need help",
      senderEmail: "student@example.com",
      status: "NEW",
      createdAt: expect.any(Date),
    });
  });
});
