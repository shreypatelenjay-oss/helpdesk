import { describe, test, expect, mock, beforeEach } from "bun:test";

const sendMail = mock(() => Promise.resolve({}));

mock.module("nodemailer", () => ({
  default: {
    createTransport: () => ({ sendMail }),
  },
}));

process.env.GMAIL_USER = "sender@gmail.com";
process.env.GMAIL_APP_PASSWORD = "test-app-password";

const { sendReplyEmail } = await import("./mailer");

describe("sendReplyEmail", () => {
  beforeEach(() => {
    sendMail.mockClear();
  });

  test("prefixes subject with 'Re: ' when missing", async () => {
    await sendReplyEmail({ to: "customer@example.com", subject: "Password reset", text: "Here you go" });

    expect(sendMail).toHaveBeenCalledTimes(1);
    const arg = sendMail.mock.calls[0][0];
    expect(arg.subject).toBe("Re: Password reset");
  });

  test("does not double-prefix a subject that already starts with 'Re:'", async () => {
    await sendReplyEmail({ to: "customer@example.com", subject: "Re: Password reset", text: "Here you go" });

    const arg = sendMail.mock.calls[0][0];
    expect(arg.subject).toBe("Re: Password reset");
  });

  test("sends from GMAIL_USER, to the given recipient, with text and html", async () => {
    await sendReplyEmail({
      to: "customer@example.com",
      subject: "Ticket update",
      text: "plain body",
      html: "<p>html body</p>",
    });

    const arg = sendMail.mock.calls[0][0];
    expect(arg.from).toBe("sender@gmail.com");
    expect(arg.to).toBe("customer@example.com");
    expect(arg.text).toBe("plain body");
    expect(arg.html).toBe("<p>html body</p>");
  });
});
