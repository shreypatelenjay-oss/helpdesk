import { describe, test, expect, mock, beforeEach } from "bun:test";

const connect = mock(() => Promise.resolve());
const logout = mock(() => Promise.resolve());
const lockRelease = mock(() => {});
const getMailboxLock = mock(() => Promise.resolve({ release: lockRelease }));
const status = mock(() => Promise.resolve({ uidNext: 3, uidValidity: 100n }));

function makeMessage(uid: number) {
  return { uid, source: Buffer.from(`raw-${uid}`) };
}

let fetchResults: ReturnType<typeof makeMessage>[] = [makeMessage(1), makeMessage(2)];
const fetch = mock(async function* () {
  for (const m of fetchResults) yield m;
});

mock.module("imapflow", () => ({
  ImapFlow: mock(function () {
    return { connect, logout, getMailboxLock, status, fetch };
  }),
}));

const simpleParser = mock((source: Buffer) => {
  const uid = source.toString().replace("raw-", "");
  if (uid === "2") {
    return Promise.resolve({ from: undefined, subject: "No sender", text: "body", headers: new Map() });
  }
  return Promise.resolve({
    from: { value: [{ address: `student${uid}@example.com` }] },
    subject: `Question ${uid}`,
    text: `Body ${uid}`,
    html: undefined,
    headers: new Map(),
  });
});

mock.module("mailparser", () => ({ simpleParser }));

const createTicketFromEmail = mock(() => Promise.resolve({ id: "ticket-x" }));
const syncAgentReplyFromEmail = mock(() => Promise.resolve());
mock.module("./createTicketFromEmail", () => ({ createTicketFromEmail, syncAgentReplyFromEmail }));

const imapSyncStateFindUnique = mock(() => Promise.resolve(null));
const imapSyncStateUpsert = mock(() => Promise.resolve());
mock.module("./prisma", () => ({
  default: { imapSyncState: { findUnique: imapSyncStateFindUnique, upsert: imapSyncStateUpsert } },
}));

const { imapPollWorker } = await import("./imapPoll");

describe("imapPollWorker", () => {
  beforeEach(() => {
    connect.mockClear();
    logout.mockClear();
    lockRelease.mockClear();
    getMailboxLock.mockClear();
    status.mockClear();
    fetch.mockClear();
    simpleParser.mockClear();
    createTicketFromEmail.mockClear();
    syncAgentReplyFromEmail.mockClear();
    imapSyncStateFindUnique.mockClear();
    imapSyncStateUpsert.mockClear();
    fetchResults = [makeMessage(1), makeMessage(2)];
    imapSyncStateFindUnique.mockImplementation(() => Promise.resolve(null));
    process.env.GMAIL_USER = "sender@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "app-password";
  });

  test("skips the poll entirely when Gmail credentials are missing", async () => {
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    await imapPollWorker([{ data: {} } as any]);

    expect(connect).not.toHaveBeenCalled();
  });

  test("processes messages regardless of their \\Seen flag (fetches by UID range, not unseen search)", async () => {
    await imapPollWorker([{ data: {} } as any]);

    expect(createTicketFromEmail).toHaveBeenCalledTimes(1);
    expect(createTicketFromEmail).toHaveBeenCalledWith({
      from: "student1@example.com",
      subject: "Question 1",
      text: "Body 1",
      html: undefined,
      to: undefined,
    });
  });

  test("also polls the Sent mailbox and syncs agent-composed replies not sent through the app", async () => {
    await imapPollWorker([{ data: {} } as any]);

    // Both INBOX and Sent Mail are fetched over the same UID range in this fixture, so every
    // parsed message with a subject also gets handled as a candidate Sent-mail agent reply.
    expect(syncAgentReplyFromEmail).toHaveBeenCalledTimes(2);
  });

  test("does not re-sync a Sent-mail message that was already sent through the app", async () => {
    simpleParser.mockImplementation(() =>
      Promise.resolve({
        from: { value: [{ address: "agent@example.com" }] },
        to: { text: "student@example.com" },
        subject: "Question",
        text: "Body",
        headers: new Map([["x-helpdesk-app-reply", "1"]]),
      })
    );
    fetchResults = [makeMessage(1)];

    await imapPollWorker([{ data: {} } as any]);

    expect(syncAgentReplyFromEmail).not.toHaveBeenCalled();
  });

  test("skips messages with no resolvable from address but still advances the sync state past them", async () => {
    await imapPollWorker([{ data: {} } as any]);

    expect(imapSyncStateUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ lastUid: 2 }),
        update: expect.objectContaining({ lastUid: 2 }),
      })
    );
  });

  test("does not reprocess messages already covered by the stored lastUid", async () => {
    imapSyncStateFindUnique.mockImplementation(() =>
      Promise.resolve({ mailbox: "INBOX", uidValidity: 100n, lastUid: 2, updatedAt: new Date() })
    );
    status.mockImplementation(() => Promise.resolve({ uidNext: 3, uidValidity: 100n }));

    await imapPollWorker([{ data: {} } as any]);

    expect(fetch).not.toHaveBeenCalled();
    expect(createTicketFromEmail).not.toHaveBeenCalled();
  });

  test("resets to processing from scratch when uidValidity changes (mailbox recreated)", async () => {
    imapSyncStateFindUnique.mockImplementation(() =>
      Promise.resolve({ mailbox: "INBOX", uidValidity: 999n, lastUid: 2, updatedAt: new Date() })
    );
    status.mockImplementation(() => Promise.resolve({ uidNext: 3, uidValidity: 100n }));

    await imapPollWorker([{ data: {} } as any]);

    expect(fetch).toHaveBeenCalledWith("1:2", { source: true, uid: true }, { uid: true });
  });

  test("releases each mailbox lock and logs out once, even when processing succeeds", async () => {
    await imapPollWorker([{ data: {} } as any]);

    expect(getMailboxLock).toHaveBeenCalledTimes(2);
    expect(lockRelease).toHaveBeenCalledTimes(2);
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
