import { describe, test, expect, mock, beforeEach, afterAll } from "bun:test";

let generateTextResult: { text: string } | Error = { text: JSON.stringify({ canResolve: false, reply: "" }) };
const generateText = mock(() => {
  if (generateTextResult instanceof Error) return Promise.reject(generateTextResult);
  return Promise.resolve(generateTextResult);
});
mock.module("ai", () => ({ generateText }));

mock.module("@ai-sdk/google", () => ({ google: mock((model: string) => model) }));

const getAIAgent = mock(() => Promise.resolve({ id: "ai-agent-id" }));
mock.module("./aiAgent", () => ({ getAIAgent }));

const sendReplyEmail = mock(() => Promise.resolve());
mock.module("./mailer", () => ({ sendReplyEmail }));

const ticketFindUniqueOrThrow = mock(() => Promise.resolve({ assignedTo: null }));
const ticketUpdate = mock(() => Promise.resolve({ senderEmail: "student@example.com" }));
const replyCreate = mock(() => Promise.resolve({}));
const transaction = mock((ops: unknown[]) => Promise.resolve(ops));
mock.module("./prisma", () => ({
  default: {
    ticket: { findUniqueOrThrow: ticketFindUniqueOrThrow, update: ticketUpdate },
    reply: { create: replyCreate },
    $transaction: transaction,
  },
}));

const { autoResolveTicketWorker } = await import("./autoResolveTicket");

function makeJob(overrides?: Partial<{ ticketId: string; subject: string; body: string }>) {
  return [
    {
      data: {
        ticketId: "ticket-1",
        subject: "How do I reset my password?",
        body: "I forgot my password, can you help?",
        ...overrides,
      },
    },
  ] as any;
}

describe("autoResolveTicketWorker", () => {
  beforeEach(() => {
    generateText.mockClear();
    getAIAgent.mockClear();
    sendReplyEmail.mockClear();
    ticketFindUniqueOrThrow.mockClear();
    ticketUpdate.mockClear();
    replyCreate.mockClear();
    transaction.mockClear();
    generateTextResult = { text: JSON.stringify({ canResolve: false, reply: "" }) };
    ticketFindUniqueOrThrow.mockImplementation(() => Promise.resolve({ assignedTo: null }));
    ticketUpdate.mockImplementation(() => Promise.resolve({ senderEmail: "student@example.com" }));
  });

  test("marks the ticket PROCESSING and assigns the AI agent before generating a response", async () => {
    await autoResolveTicketWorker(makeJob());

    expect(ticketUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket-1" },
        data: { status: "PROCESSING", assignedTo: "ai-agent-id" },
      })
    );
  });

  test("when the AI can resolve the ticket, creates an AGENT reply, marks it RESOLVED by AI, and emails the customer", async () => {
    generateTextResult = {
      text: JSON.stringify({ canResolve: true, reply: "Hi Student,\n\nHere's how to reset your password..." }),
    };

    await autoResolveTicketWorker(makeJob());

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(replyCreate).toHaveBeenCalledWith({
      data: { ticketId: "ticket-1", body: "Hi Student,\n\nHere's how to reset your password...", senderType: "AGENT" },
    });
    expect(ticketUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ticket-1" },
        data: expect.objectContaining({ status: "RESOLVED", resolvedByAI: true }),
      })
    );

    expect(sendReplyEmail).toHaveBeenCalledTimes(1);
    expect(sendReplyEmail).toHaveBeenCalledWith({
      to: "student@example.com",
      subject: "How do I reset my password?",
      text: "Hi Student,\n\nHere's how to reset your password...",
      ticketId: "ticket-1",
    });
  });

  test("when the AI cannot resolve the ticket, reverts to OPEN, unassigns it, and does not email the customer", async () => {
    generateTextResult = { text: JSON.stringify({ canResolve: false, reply: "" }) };

    await autoResolveTicketWorker(makeJob());

    expect(transaction).not.toHaveBeenCalled();
    expect(replyCreate).not.toHaveBeenCalled();
    expect(ticketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { status: "OPEN", assignedTo: null },
    });
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  test("reverts to OPEN and does not email when the AI response is not valid JSON", async () => {
    generateTextResult = { text: "not json" };

    await autoResolveTicketWorker(makeJob());

    expect(ticketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { status: "OPEN", assignedTo: null },
    });
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  test("reverts to OPEN and does not email when generateText throws", async () => {
    generateTextResult = new Error("model unavailable");

    await autoResolveTicketWorker(makeJob());

    expect(ticketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { status: "OPEN", assignedTo: null },
    });
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  test("parses a resolvable response even when Gemini wraps the JSON in a markdown code fence", async () => {
    generateTextResult = {
      text: "```json\n" + JSON.stringify({ canResolve: true, reply: "Hi Student,\n\nHere's the answer." }) + "\n```",
    };

    await autoResolveTicketWorker(makeJob());

    expect(sendReplyEmail).toHaveBeenCalledTimes(1);
    expect(replyCreate).toHaveBeenCalledWith({
      data: { ticketId: "ticket-1", body: "Hi Student,\n\nHere's the answer.", senderType: "AGENT" },
    });
  });

  test("skips entirely when the ticket is already assigned to a human agent", async () => {
    ticketFindUniqueOrThrow.mockImplementation(() => Promise.resolve({ assignedTo: "human-agent-id" }));

    await autoResolveTicketWorker(makeJob());

    expect(generateText).not.toHaveBeenCalled();
    expect(ticketUpdate).not.toHaveBeenCalled();
    expect(sendReplyEmail).not.toHaveBeenCalled();
  });

  afterAll(() => {
    mock.restore();
  });
});
