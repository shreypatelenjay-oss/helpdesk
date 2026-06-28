import type { TicketStatus } from "./ticket-status";
import type { TicketCategory } from "./ticket-category";
import type { Reply } from "./reply";

export type Agent = {
  id: string;
  name: string | null;
  email: string;
};

export type Ticket = {
  id: string;
  subject: string;
  body: string;
  senderEmail: string;
  status: TicketStatus;
  category: TicketCategory | null;
  createdAt: string;
  assignedTo: string | null;
  agent: Agent | null;
  replies: Reply[];
};
