import prisma from "../src/lib/prisma";
import { TicketStatus, TicketCategory } from "@prisma/client";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 14) + 7);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

const tickets: Array<{
  subject: string;
  body: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory;
  createdAt: Date;
}> = [
  { subject: "How do I archive old tickets?", body: "We have hundreds of resolved tickets cluttering the view. Is there an archive feature?", senderEmail: "ian.marsh@cleandesk.com", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(5) },
  { subject: "Can I schedule a call with support?", body: "I'd prefer to talk through my setup rather than email back and forth.", senderEmail: "julia.cross@phonecall.pls", status: "OPEN", category: "GENERAL_QUESTION", createdAt: daysAgo(6) },
  { subject: "Auto-responder email not sending", body: "New ticket auto-replies aren't going out. I checked spam and nothing arrived.", senderEmail: "ken.larson@emailops.com", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(3) },
  { subject: "CSV import row limit", body: "My import fails at exactly 10,000 rows every time. Is there a hard cap?", senderEmail: "lisa.munoz@dataimport.io", status: "OPEN", category: "TECHNICAL_QUESTION", createdAt: daysAgo(4) },
  { subject: "Refund — feature never worked as advertised", body: "The AI reply suggestion feature has never produced useful output in 2 months.", senderEmail: "max.obrien@disappointed.com", status: "OPEN", category: "REFUND_REQUEST", createdAt: daysAgo(5) },
  { subject: "Password policy requirements", body: "What are the minimum password requirements for agent accounts?", senderEmail: "nora.petrov@it.admin", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(20) },
  { subject: "Forwarding emails to create tickets", body: "Can I forward existing customer emails to an address that auto-creates tickets?", senderEmail: "omar.quinn@forwarder.co", status: "RESOLVED", category: "GENERAL_QUESTION", createdAt: daysAgo(22) },
  { subject: "Custom fields on ticket form", body: "We need to capture a customer account number on every ticket. Is this possible?", senderEmail: "petra.roth@customfields.de", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(18) },
  { subject: "Notification emails contain plain HTML", body: "The emails we receive look like raw HTML — tags are not being rendered.", senderEmail: "raj.sharma@htmlbug.in", status: "RESOLVED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(25) },
  { subject: "Refund — switched to competitor", body: "We've moved to a different platform and would like a refund for unused days.", senderEmail: "sara.thompson@switched.away", status: "RESOLVED", category: "REFUND_REQUEST", createdAt: daysAgo(30) },
  { subject: "What happens to tickets when an agent is deleted?", body: "If I remove an agent account, are their assigned tickets reassigned or deleted?", senderEmail: "tom.underhill@admin.query", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(70) },
  { subject: "Character limit on ticket body", body: "Is there a maximum length for the ticket description field?", senderEmail: "uma.vasquez@longwriter.com", status: "CLOSED", category: "GENERAL_QUESTION", createdAt: daysAgo(72) },
  { subject: "Outbound email marked as phishing", body: "Microsoft 365 is flagging our reply emails as phishing. SPF/DKIM issue?", senderEmail: "victor.walsh@deliverability.com", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(68) },
  { subject: "Keyboard shortcuts not working on Windows", body: "Ctrl+K to open the command palette does nothing on Windows 11 / Chrome.", senderEmail: "wendy.xu@windows.user", status: "CLOSED", category: "TECHNICAL_QUESTION", createdAt: daysAgo(75) },
  { subject: "Refund — billing after account suspension", body: "My account was suspended for an alleged ToS violation, yet I was still billed that month.", senderEmail: "yusuf.zayed@suspension.refund", status: "CLOSED", category: "REFUND_REQUEST", createdAt: daysAgo(66) },
];

async function run() {
  console.log(`Inserting ${tickets.length} additional tickets…`);
  const result = await prisma.ticket.createMany({ data: tickets, skipDuplicates: false });
  console.log(`Done — created ${result.count} tickets.`);
  const total = await prisma.ticket.count();
  console.log(`Total tickets in DB: ${total}`);
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
