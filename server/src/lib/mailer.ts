import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default transporter;

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

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    replyTo: ticketId ? ticketReplyToAddress(ticketId) : undefined,
    subject: finalSubject,
    text,
    html,
    // Marks mail sent by the app so Sent-folder polling can skip it — it's already recorded
    // as a Reply row when it was sent, so re-syncing it would create a duplicate.
    headers: { "X-Helpdesk-App-Reply": "1" },
  });
}
