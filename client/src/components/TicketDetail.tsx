import { Card, CardContent } from "./ui/card";
import type { Ticket } from "@repo/core";

const STATUS_STYLES = {
  NEW: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PROCESSING: "bg-orange-100 text-orange-700 border-orange-200",
  OPEN: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABELS = {
  NEW: "New",
  PROCESSING: "Processing",
  OPEN: "Open",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const CATEGORY_STYLES = {
  GENERAL_QUESTION: "bg-purple-100 text-purple-700 border-purple-200",
  TECHNICAL_QUESTION: "bg-amber-100 text-amber-700 border-amber-200",
  REFUND_REQUEST: "bg-rose-100 text-rose-700 border-rose-200",
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
      {/* Badges */}
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${STATUS_STYLES[ticket.status]}`}
        >
          {STATUS_LABELS[ticket.status]}
        </span>
        {ticket.category && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${CATEGORY_STYLES[ticket.category]}`}
          >
            {CATEGORY_LABELS[ticket.category]}
          </span>
        )}
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{ticket.subject}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>From:</span>
          <span className="font-semibold text-gray-700">{ticket.senderEmail}</span>
          <span>•</span>
          <span>Created:</span>
          <span className="font-medium text-gray-700">
            {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Body */}
      <Card className="shadow-xs border-gray-200/80">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-950 border-b border-gray-100 pb-3">
            Description
          </h3>
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans text-sm md:text-base">
            {ticket.body}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
