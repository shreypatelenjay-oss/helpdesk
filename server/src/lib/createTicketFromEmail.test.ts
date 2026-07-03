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
const ticketFindUnique = mock(() => Promise.resolve(null));
const ticketFindFirst = mock(() => Promise.resolve(null));
const ticketUpdate = mock((args: any) => Promise.resolve({ id: args.where.id, ...args.data }));
const replyCreate = mock(() => Promise.resolve({ id: "reply-1" }));
const replyFindMany = mock(() => Promise.resolve([]));
const transaction = mock((ops: Promise<unknown>[]) => Promise.all(ops));
const bossSend = mock(() => Promise.resolve());

mock.module("./prisma", () => ({
  default: {
    ticket: { create: ticketCreate, findUnique: ticketFindUnique, findFirst: ticketFindFirst, update: ticketUpdate },
    reply: { create: replyCreate, findMany: replyFindMany },
    $transaction: transaction,
  },
}));
mock.module("./boss", () => ({
  default: { send: bossSend },
}));

const { createTicketFromEmail, syncAgentReplyFromEmail } = await import("./createTicketFromEmail");
const { CLASSIFY_QUEUE } = await import("./classifyTicket");
const { AUTO_RESOLVE_QUEUE } = await import("./autoResolveTicket");

describe("createTicketFromEmail", () => {
  beforeEach(() => {
    ticketCreate.mockClear();
    ticketFindUnique.mockClear();
    ticketFindFirst.mockClear();
    ticketUpdate.mockClear();
    replyCreate.mockClear();
    replyFindMany.mockClear();
    transaction.mockClear();
    bossSend.mockClear();
    ticketFindUnique.mockImplementation(() => Promise.resolve(null));
    ticketFindFirst.mockImplementation(() => Promise.resolve(null));
    replyFindMany.mockImplementation(() => Promise.resolve([]));
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

  test("threads a reply sent to the plus-addressed ticket token onto the existing ticket instead of creating a new one", async () => {
    ticketFindUnique.mockImplementation(() =>
      Promise.resolve({ id: "cmticket42", subject: "Refund request", senderEmail: "student@example.com", body: "original body", status: "RESOLVED" })
    );

    const result = await createTicketFromEmail({
      from: "student@example.com",
      subject: "Re: Refund request",
      text: "Any update?",
      to: "shreypatel1231+ticket-cmticket42@gmail.com",
    });

    expect(ticketFindUnique).toHaveBeenCalledWith({ where: { id: "cmticket42" } });
    expect(ticketCreate).not.toHaveBeenCalled();
    expect(replyCreate).toHaveBeenCalledWith({
      data: { ticketId: "cmticket42", body: "Any update?", senderType: "CUSTOMER" },
    });
    expect(ticketUpdate).toHaveBeenCalledWith({
      where: { id: "cmticket42" },
      data: { status: "OPEN", resolvedByAI: false, resolvedAt: null },
    });
    expect(result.id).toBe("cmticket42");
  });

  test("falls back to matching by sender + normalized subject when there is no plus-address tag", async () => {
    ticketFindFirst.mockImplementation(() =>
      Promise.resolve({ id: "ticket-7", subject: "Need help", senderEmail: "student@example.com", body: "original body", status: "OPEN" })
    );

    await createTicketFromEmail({
      from: "student@example.com",
      subject: "Re: Need help",
      text: "Following up",
    });

    expect(ticketFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ senderEmail: "student@example.com", subject: { equals: "need help", mode: "insensitive" } }),
      })
    );
    expect(ticketCreate).not.toHaveBeenCalled();
    expect(replyCreate).toHaveBeenCalledWith({
      data: { ticketId: "ticket-7", body: "Following up", senderType: "CUSTOMER" },
    });
  });

  test("re-enqueues auto-resolve (not classify) with full conversation context when threading a reply", async () => {
    ticketFindFirst.mockImplementation(() =>
      Promise.resolve({ id: "ticket-7", subject: "Need help", senderEmail: "student@example.com", body: "original body", status: "OPEN" })
    );
    replyFindMany.mockImplementation(() =>
      Promise.resolve([{ body: "first agent reply", senderType: "AGENT" }])
    );

    await createTicketFromEmail({
      from: "student@example.com",
      subject: "Re: Need help",
      text: "Following up",
    });

    expect(bossSend).toHaveBeenCalledTimes(1);
    expect(bossSend).toHaveBeenCalledWith(AUTO_RESOLVE_QUEUE, {
      ticketId: "ticket-7",
      subject: "Need help",
      body: "original body\n\n[Agent]: first agent reply",
    });
  });

  test("creates a new ticket when sender + subject don't match any existing non-closed ticket", async () => {
    await createTicketFromEmail({
      from: "student@example.com",
      subject: "Re: Something unrelated",
      text: "hello",
    });

    expect(ticketCreate).toHaveBeenCalledTimes(1);
  });
});

describe("syncAgentReplyFromEmail", () => {
  beforeEach(() => {
    ticketFindUnique.mockClear();
    ticketFindFirst.mockClear();
    replyCreate.mockClear();
    ticketFindUnique.mockImplementation(() => Promise.resolve(null));
    ticketFindFirst.mockImplementation(() => Promise.resolve(null));
  });

  test("logs the reply against the ticket matched via the plus-addressed tag", async () => {
    ticketFindUnique.mockImplementation(() =>
      Promise.resolve({ id: "cmticket42", subject: "Refund request", senderEmail: "student@example.com" })
    );

    await syncAgentReplyFromEmail({
      to: "student@example.com, shreypatel1231+ticket-cmticket42@gmail.com",
      subject: "Re: Refund request",
      text: "Handled this over email, refund issued.",
    });

    expect(ticketFindUnique).toHaveBeenCalledWith({ where: { id: "cmticket42" } });
    expect(replyCreate).toHaveBeenCalledWith({
      data: { ticketId: "cmticket42", body: "Handled this over email, refund issued.", senderType: "AGENT" },
    });
  });

  test("falls back to matching by recipient email + normalized subject when there is no plus tag", async () => {
    ticketFindFirst.mockImplementation(() =>
      Promise.resolve({ id: "ticket-7", subject: "Need help", senderEmail: "student@example.com" })
    );

    await syncAgentReplyFromEmail({
      to: "student@example.com",
      subject: "Re: Need help",
      text: "Following up from Gmail directly",
    });

    expect(ticketFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ senderEmail: "student@example.com", subject: { equals: "need help", mode: "insensitive" } }),
      })
    );
    expect(replyCreate).toHaveBeenCalledWith({
      data: { ticketId: "ticket-7", body: "Following up from Gmail directly", senderType: "AGENT" },
    });
  });

  test("does nothing when no ticket matches", async () => {
    await syncAgentReplyFromEmail({
      to: "nobody@example.com",
      subject: "Re: Unrelated",
      text: "hello",
    });

    expect(replyCreate).not.toHaveBeenCalled();
  });
});
