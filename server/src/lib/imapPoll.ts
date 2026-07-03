import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { Job } from "pg-boss";
import { createTicketFromEmail, syncAgentReplyFromEmail } from "./createTicketFromEmail";
import prisma from "./prisma";

export const IMAP_POLL_QUEUE = "imap-poll";
const INBOX = "INBOX";
// Agent replies composed directly in Gmail (not through the app) only ever show up here.
const SENT_MAILBOX = "[Gmail]/Sent Mail";

interface ParsedPollMessage {
  from?: string;
  to?: string;
  subject: string;
  text?: string;
  html?: string;
  isAppSent: boolean;
}

async function pollMailbox(
  client: ImapFlow,
  mailbox: string,
  handle: (message: ParsedPollMessage) => Promise<void>
) {
  const lock = await client.getMailboxLock(mailbox);
  try {
    const status = await client.status(mailbox, { uidNext: true, uidValidity: true });
    const uidValidity = status.uidValidity ?? 0n;

    const syncState = await prisma.imapSyncState.findUnique({ where: { mailbox } });

    // If the mailbox was recreated (uidValidity changed), old UIDs are meaningless — start over from now.
    const lastUid = syncState && syncState.uidValidity === uidValidity ? syncState.lastUid : 0;

    const uidNext = status.uidNext ?? 1;
    if (uidNext <= lastUid + 1) {
      return;
    }

    let highestProcessedUid = lastUid;

    for await (const message of client.fetch(
      `${lastUid + 1}:${uidNext - 1}`,
      { source: true, uid: true },
      { uid: true }
    )) {
      if (!message.source) continue;

      const parsed = await simpleParser(message.source);
      const from = parsed.from?.value[0]?.address;
      const to = Array.isArray(parsed.to)
        ? parsed.to.map((a) => a.text).join(", ")
        : parsed.to?.text;
      const isAppSent = !!parsed.headers?.get?.("x-helpdesk-app-reply");

      if (!from && mailbox === INBOX) {
        console.warn(`[imapPoll] skipping message uid=${message.uid} in ${mailbox} — no from address`);
      } else {
        await handle({
          from,
          to,
          subject: parsed.subject ?? "(no subject)",
          text: parsed.text,
          html: typeof parsed.html === "string" ? parsed.html : undefined,
          isAppSent,
        });
      }

      highestProcessedUid = Math.max(highestProcessedUid, message.uid);
    }

    await prisma.imapSyncState.upsert({
      where: { mailbox },
      create: { mailbox, uidValidity, lastUid: highestProcessedUid },
      update: { uidValidity, lastUid: highestProcessedUid },
    });
  } finally {
    lock.release();
  }
}

export async function imapPollWorker([_job]: Job<{}>[]) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[imapPoll] GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping poll");
    return;
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  await client.connect();

  try {
    await pollMailbox(client, INBOX, async ({ from, to, subject, text, html }) => {
      if (!from) return;
      await createTicketFromEmail({ from, subject, text, html, to });
    });

    await pollMailbox(client, SENT_MAILBOX, async ({ to, subject, text, html, isAppSent }) => {
      // Replies sent through the app's own reply box are already recorded as a Reply row —
      // re-syncing them here would create a duplicate.
      if (isAppSent) return;
      await syncAgentReplyFromEmail({ to, subject, text, html });
    });
  } finally {
    await client.logout();
  }
}
