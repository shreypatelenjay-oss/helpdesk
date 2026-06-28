import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
const STATUS_STYLES = {
    OPEN: "bg-blue-100 text-blue-700 border-blue-200",
    RESOLVED: "bg-green-100 text-green-700 border-green-200",
    CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
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
function axiosError(e, fallback) {
    return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}
export function TicketDetailPage() {
    const { id } = useParams();
    const qc = useQueryClient();
    const { data: ticket, isPending, error } = useQuery({
        queryKey: ["ticket", id],
        queryFn: () => axios.get(`/api/tickets/${id}`).then((r) => r.data),
    });
    const { data: agents } = useQuery({
        queryKey: ["agents"],
        queryFn: () => axios.get("/api/users/agents").then((r) => r.data),
    });
    const updateTicket = useMutation({
        mutationFn: (body) => axios.patch(`/api/tickets/${id}`, body).then((r) => r.data),
        onSuccess: (updated) => {
            qc.setQueryData(["ticket", id], updated);
            qc.invalidateQueries({ queryKey: ["tickets"] });
        },
    });
    if (isPending) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50", "data-testid": "detail-loading", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8 space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Skeleton, { className: "h-9 w-24" }), _jsx(Skeleton, { className: "h-6 w-16" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsxs("div", { className: "md:col-span-2 space-y-4", children: [_jsx(Skeleton, { className: "h-10 w-3/4" }), _jsx(Skeleton, { className: "h-64 w-full" })] }), _jsx("div", { className: "space-y-4", children: _jsx(Skeleton, { className: "h-48 w-full" }) })] })] })] }));
    }
    if (error || !ticket) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50", "data-testid": "detail-error", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8 text-center space-y-4", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Ticket not found" }), _jsx("p", { className: "text-gray-500", children: error ? axiosError(error, "Failed to load ticket details") : "The requested ticket does not exist." }), _jsx(Link, { to: "/tickets", className: "hover:no-underline", children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Back to Tickets"] }) })] })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", "data-testid": "detail-container", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8 space-y-6", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsx(Link, { to: "/tickets", className: "hover:no-underline", children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-600 hover:text-gray-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Back to Tickets"] }) }), _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("span", { className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${STATUS_STYLES[ticket.status]}`, children: ticket.status.charAt(0) + ticket.status.slice(1).toLowerCase() }), ticket.category && (_jsx("span", { className: `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${CATEGORY_STYLES[ticket.category]}`, children: CATEGORY_LABELS[ticket.category] }))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h1", { className: "text-3xl font-extrabold text-gray-900 tracking-tight", children: ticket.subject }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [_jsx("span", { children: "From:" }), _jsx("span", { className: "font-semibold text-gray-700", children: ticket.senderEmail }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: "Created:" }), _jsx("span", { className: "font-medium text-gray-700", children: new Date(ticket.createdAt).toLocaleString() })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 items-start", children: [_jsx("div", { className: "md:col-span-2 space-y-6", children: _jsx(Card, { className: "shadow-xs border-gray-200/80", children: _jsxs(CardContent, { className: "p-6 space-y-4", children: [_jsx("h3", { className: "text-lg font-bold text-gray-950 border-b border-gray-100 pb-3", children: "Description" }), _jsx("div", { className: "whitespace-pre-wrap text-gray-700 leading-relaxed font-sans text-sm md:text-base", children: ticket.body })] }) }) }), _jsx("div", { className: "space-y-6", children: _jsx(Card, { className: "shadow-xs border-gray-200/80", children: _jsxs(CardContent, { className: "p-6 space-y-5", children: [_jsx("h3", { className: "text-lg font-bold text-gray-950 border-b border-gray-100 pb-3", children: "Ticket Attributes" }), updateTicket.isError && (_jsx("p", { className: "text-xs text-destructive", children: axiosError(updateTicket.error, "Failed to update attributes") })), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "ticket-status-select", className: "text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Status" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { id: "ticket-status-select", value: ticket.status, disabled: updateTicket.isPending, onChange: (e) => updateTicket.mutate({ status: e.target.value }), className: "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all", children: [_jsx("option", { value: "OPEN", children: "Open" }), _jsx("option", { value: "RESOLVED", children: "Resolved" }), _jsx("option", { value: "CLOSED", children: "Closed" })] }), updateTicket.isPending && (_jsx(Loader2, { className: "absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" }))] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "ticket-category-select", className: "text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Category" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { id: "ticket-category-select", value: ticket.category ?? "UNASSIGNED", disabled: updateTicket.isPending, onChange: (e) => updateTicket.mutate({
                                                                    category: e.target.value === "UNASSIGNED" ? null : e.target.value,
                                                                }), className: "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all", children: [_jsx("option", { value: "UNASSIGNED", children: "Unassigned" }), _jsx("option", { value: "GENERAL_QUESTION", children: "General" }), _jsx("option", { value: "TECHNICAL_QUESTION", children: "Technical" }), _jsx("option", { value: "REFUND_REQUEST", children: "Refund" })] }), updateTicket.isPending && (_jsx(Loader2, { className: "absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" }))] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "ticket-assignee-select", className: "text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Assigned Agent" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { id: "ticket-assignee-select", value: ticket.assignedTo ?? "UNASSIGNED", disabled: updateTicket.isPending, onChange: (e) => updateTicket.mutate({
                                                                    assignedTo: e.target.value === "UNASSIGNED" ? null : e.target.value,
                                                                }), className: "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all", children: [_jsx("option", { value: "UNASSIGNED", children: "Unassigned" }), agents?.map((agent) => (_jsx("option", { value: agent.id, children: agent.name ?? agent.email }, agent.id)))] }), updateTicket.isPending && (_jsx(Loader2, { className: "absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" }))] })] })] }) }) })] })] })] }));
}
