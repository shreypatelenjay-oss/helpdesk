import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default transporter;

export async function sendReplyEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const finalSubject = subject.trim().toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: finalSubject,
    text,
    html,
  });
}
