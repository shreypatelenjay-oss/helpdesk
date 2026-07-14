// Railway's network blocks outbound SMTP ports (465/587) entirely, so direct
// SMTP send (nodemailer) times out — send outbound mail over HTTPS via Resend instead.
// Inbound mail still comes in over IMAP (imapPoll.ts), which uses port 993 and is unaffected.
const RESEND_API_URL = "https://api.resend.com/emails";

// Gmail plus-addressing: mail sent to "local+ticket-<id>@domain" still lands in the
// same inbox, so replying to this address lets inbound polling thread the reply back
// to the right ticket instead of creating a duplicate one.
export function ticketReplyToAddress(ticketId: string): string | undefined {
  const gmailUser = process.env.GMAIL_USER;
  if (!gmailUser) return undefined;
  const [local, domain] = gmailUser.split("@");
  return `${local}+ticket-${ticketId}@${domain}`;
}

export async function sendReplyEmail({
  to,
  subject,
  text,
  html,
  ticketId,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  ticketId?: string;
}) {
  const finalSubject = subject.trim().toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      reply_to: ticketId ? ticketReplyToAddress(ticketId) : undefined,
      subject: finalSubject,
      text,
      html,
      // Marks mail sent by the app so Sent-folder polling can skip it — it's already recorded
      // as a Reply row when it was sent, so re-syncing it would create a duplicate.
      headers: { "X-Helpdesk-App-Reply": "1" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  }
}
