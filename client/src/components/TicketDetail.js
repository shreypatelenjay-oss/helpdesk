import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from "./ui/card";
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
export function TicketDetail({ ticket }) {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("span", { className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${STATUS_STYLES[ticket.status]}`, children: STATUS_LABELS[ticket.status] }), ticket.category && (_jsx("span", { className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${CATEGORY_STYLES[ticket.category]}`, children: CATEGORY_LABELS[ticket.category] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h1", { className: "text-3xl font-extrabold text-gray-900 tracking-tight", children: ticket.subject }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [_jsx("span", { children: "From:" }), _jsx("span", { className: "font-semibold text-gray-700", children: ticket.senderEmail }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: "Created:" }), _jsx("span", { className: "font-medium text-gray-700", children: new Date(ticket.createdAt).toLocaleString() })] })] }), _jsx(Card, { className: "shadow-xs border-gray-200/80", children: _jsxs(CardContent, { className: "p-6 space-y-4", children: [_jsx("h3", { className: "text-lg font-bold text-gray-950 border-b border-gray-100 pb-3", children: "Description" }), _jsx("div", { className: "whitespace-pre-wrap text-gray-700 leading-relaxed font-sans text-sm md:text-base", children: ticket.body })] }) })] }));
}
