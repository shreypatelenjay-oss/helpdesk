import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
const STATUS_STYLES = {
    OPEN: "bg-blue-100 text-blue-700",
    RESOLVED: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-600",
};
const CATEGORY_LABELS = {
    GENERAL_QUESTION: "General",
    TECHNICAL_QUESTION: "Technical",
    REFUND_REQUEST: "Refund",
};
function axiosError(e, fallback) {
    return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}
export function TicketsPage() {
    const { data: tickets, isPending, error } = useQuery({
        queryKey: ["tickets"],
        queryFn: () => axios.get("/api/tickets").then((r) => r.data),
    });
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8", children: [_jsx("div", { className: "flex items-center justify-between mb-6", children: _jsx("h1", { className: "text-2xl font-semibold text-gray-900", children: "Tickets" }) }), error && (_jsx("p", { className: "text-destructive text-sm mb-4", children: axiosError(error, "Failed to load tickets") })), _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-gray-500", children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Subject" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "From" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Status" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Category" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Assigned to" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Created" })] }) }), _jsxs("tbody", { children: [isPending &&
                                                Array.from({ length: 5 }).map((_, i) => (_jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-48" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-36" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-5 w-16 rounded-full" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-5 w-20 rounded-full" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-24" }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Skeleton, { className: "h-4 w-20" }) })] }, i))), !isPending && tickets?.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "px-4 py-6 text-center text-gray-400", children: "No tickets yet." }) })), tickets?.map((ticket) => (_jsxs("tr", { className: "border-b last:border-0 hover:bg-gray-50/50", children: [_jsx("td", { className: "px-4 py-3 font-medium text-gray-900 max-w-xs truncate", children: ticket.subject }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: ticket.senderEmail }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`, children: ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase() }) }), _jsx("td", { className: "px-4 py-3", children: ticket.category ? (_jsx("span", { className: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700", children: CATEGORY_LABELS[ticket.category] })) : (_jsx("span", { className: "text-gray-400", children: "\u2014" })) }), _jsx("td", { className: "px-4 py-3 text-gray-600", children: ticket.agent ? (ticket.agent.name ?? ticket.agent.email) : (_jsx("span", { className: "text-gray-400", children: "Unassigned" })) }), _jsx("td", { className: "px-4 py-3 text-gray-500", children: new Date(ticket.createdAt).toLocaleDateString() })] }, ticket.id)))] })] }) }) })] })] }));
}
