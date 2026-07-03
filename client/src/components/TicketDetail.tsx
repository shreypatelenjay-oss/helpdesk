import { Card, CardContent } from "./ui/card";
import type { Ticket } from "@repo/core";

const STATUS_STYLES = {
  NEW: "text-primary border-primary/30 bg-primary/5",
  PROCESSING: "text-amber-700 border-amber-300 bg-amber-50",
  OPEN: "text-sky-700 border-sky-300 bg-sky-50",
  RESOLVED: "text-emerald-700 border-emerald-300 bg-emerald-50",
  CLOSED: "text-muted-foreground border-border bg-muted",
};

const STATUS_LABELS = {
  NEW: "New",
  PROCESSING: "Processing",
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const CATEGORY_STYLES = {
  GENERAL_QUESTION: "text-muted-foreground border-border bg-card",
  TECHNICAL_QUESTION: "text-muted-foreground border-border bg-card",
  REFUND_REQUEST: "text-muted-foreground border-border bg-card",
};

const CATEGORY_LABELS = {
  GENERAL_QUESTION: "General",
  TECHNICAL_QUESTION: "Technical",
  REFUND_REQUEST: "Refund",
};

export { STATUS_STYLES, STATUS_LABELS, CATEGORY_STYLES, CATEGORY_LABELS };
type Props = { ticket: Ticket };

export function TicketDetail({ ticket }: Props) {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
          >
            <span className="size-1.5 rounded-full bg-current" aria-hidden />
            {STATUS_LABELS[ticket.status]}
          </span>
          {ticket.category && (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[ticket.category]}`}
            >
              {CATEGORY_LABELS[ticket.category]}
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-[28px] font-semibold text-foreground tracking-tight leading-tight">
          {ticket.subject}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">{ticket.senderEmail}</span>
          <span className="mx-2" aria-hidden>·</span>
          <span className="tabular-nums">{new Date(ticket.createdAt).toLocaleString()}</span>
        </p>
      </div>

      {/* Body */}
      <Card className="py-0 gap-0 shadow-xs">
        <div className="border-b border-border bg-muted/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </div>
        <CardContent className="px-5 py-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {ticket.body}
        </CardContent>
      </Card>
    </div>
  );
}
