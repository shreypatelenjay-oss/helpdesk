import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { Job } from "pg-boss";
import { createTicketFromEmail } from "./createTicketFromEmail";

export const IMAP_POLL_QUEUE = "imap-poll";

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
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false });
      for (const uid of uids || []) {
        const message = await client.fetchOne(String(uid), { source: true });
        if (!message || !message.source) continue;

        const parsed = await simpleParser(message.source);
        const from = parsed.from?.value[0]?.address;
        if (!from) {
          console.warn(`[imapPoll] skipping message uid=${uid} — no from address`);
          continue;
        }

        await createTicketFromEmail({
          from,
          subject: parsed.subject ?? "(no subject)",
          text: parsed.text,
          html: typeof parsed.html === "string" ? parsed.html : undefined,
        });

        await client.messageFlagsAdd(String(uid), ["\\Seen"]);
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
