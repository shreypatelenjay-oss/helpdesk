import { describe, test, expect, mock, beforeEach } from "bun:test";

const connect = mock(() => Promise.resolve());
const logout = mock(() => Promise.resolve());
const lockRelease = mock(() => {});
const getMailboxLock = mock(() => Promise.resolve({ release: lockRelease }));
const search = mock(() => Promise.resolve([1, 2]));
const fetchOne = mock((uid: string) => Promise.resolve({ source: Buffer.from(`raw-${uid}`) }));
const messageFlagsAdd = mock(() => Promise.resolve());

mock.module("imapflow", () => ({
  ImapFlow: mock(function () {
    return { connect, logout, getMailboxLock, search, fetchOne, messageFlagsAdd };
  }),
}));

const simpleParser = mock((source: Buffer) => {
  const uid = source.toString().replace("raw-", "");
  if (uid === "2") {
    return Promise.resolve({ from: undefined, subject: "No sender", text: "body" });
  }
  return Promise.resolve({
    from: { value: [{ address: `student${uid}@example.com` }] },
    subject: `Question ${uid}`,
    text: `Body ${uid}`,
    html: undefined,
  });
});

mock.module("mailparser", () => ({ simpleParser }));

const createTicketFromEmail = mock(() => Promise.resolve({ id: "ticket-x" }));
mock.module("./createTicketFromEmail", () => ({ createTicketFromEmail }));

const { imapPollWorker } = await import("./imapPoll");

describe("imapPollWorker", () => {
  beforeEach(() => {
    connect.mockClear();
    logout.mockClear();
    lockRelease.mockClear();
    getMailboxLock.mockClear();
    search.mockClear();
    fetchOne.mockClear();
    messageFlagsAdd.mockClear();
    simpleParser.mockClear();
    createTicketFromEmail.mockClear();
    process.env.GMAIL_USER = "sender@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "app-password";
  });

  test("skips the poll entirely when Gmail credentials are missing", async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    await imapPollWorker([{ data: {} } as any]);

    expect(connect).not.toHaveBeenCalled();
  });

  test("creates a ticket for each unseen message with a sender and marks it seen", async () => {
    await imapPollWorker([{ data: {} } as any]);

    expect(createTicketFromEmail).toHaveBeenCalledTimes(1);
    expect(createTicketFromEmail).toHaveBeenCalledWith({
      from: "student1@example.com",
      subject: "Question 1",
      text: "Body 1",
      html: undefined,
    });
    expect(messageFlagsAdd).toHaveBeenCalledWith("1", ["\\Seen"]);
  });

  test("skips messages with no resolvable from address and does not mark them seen", async () => {
    await imapPollWorker([{ data: {} } as any]);

    expect(messageFlagsAdd).not.toHaveBeenCalledWith("2", ["\\Seen"]);
  });

  test("releases the mailbox lock and logs out even when processing succeeds", async () => {
    await imapPollWorker([{ data: {} } as any]);

    expect(lockRelease).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
