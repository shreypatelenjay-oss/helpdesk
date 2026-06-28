import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
function axiosError(e, fallback) {
    return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}
const SELECT_CLASS = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all";
export function UpdateTicket({ ticketId, ticket }) {
    const qc = useQueryClient();
    const { data: agents } = useQuery({
        queryKey: ["agents"],
        queryFn: () => axios.get("/api/users/agents").then((r) => r.data),
    });
    const mutation = useMutation({
        mutationFn: (body) => axios.patch(`/api/tickets/${ticketId}`, body).then((r) => r.data),
        onSuccess: (updated) => {
            qc.setQueryData(["ticket", ticketId], (prev) => ({ ...prev, ...updated }));
            qc.invalidateQueries({ queryKey: ["tickets"] });
        },
    });
    return (_jsx(Card, { className: "shadow-xs border-gray-200/80", children: _jsxs(CardContent, { className: "p-6 space-y-5", children: [_jsx("h3", { className: "text-lg font-bold text-gray-950 border-b border-gray-100 pb-3", children: "Ticket Attributes" }), mutation.isError && (_jsx("p", { className: "text-xs text-destructive", children: axiosError(mutation.error, "Failed to update attributes") })), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "ticket-status-select", className: "text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Status" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { id: "ticket-status-select", value: ticket.status, disabled: mutation.isPending, onChange: (e) => mutation.mutate({ status: e.target.value }), className: SELECT_CLASS, children: [_jsx("option", { value: "OPEN", children: "Open" }), _jsx("option", { value: "RESOLVED", children: "Resolved" }), _jsx("option", { value: "CLOSED", children: "Closed" })] }), mutation.isPending && (_jsx(Loader2, { className: "absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" }))] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "ticket-category-select", className: "text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Category" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { id: "ticket-category-select", value: ticket.category ?? "UNASSIGNED", disabled: mutation.isPending, onChange: (e) => mutation.mutate({
                                        category: e.target.value === "UNASSIGNED" ? null : e.target.value,
                                    }), className: SELECT_CLASS, children: [_jsx("option", { value: "UNASSIGNED", children: "Unassigned" }), _jsx("option", { value: "GENERAL_QUESTION", children: "General" }), _jsx("option", { value: "TECHNICAL_QUESTION", children: "Technical" }), _jsx("option", { value: "REFUND_REQUEST", children: "Refund" })] }), mutation.isPending && (_jsx(Loader2, { className: "absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" }))] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { htmlFor: "ticket-assignee-select", className: "text-xs font-semibold text-gray-500 uppercase tracking-wider", children: "Assigned Agent" }), _jsxs("div", { className: "relative", children: [_jsxs("select", { id: "ticket-assignee-select", value: ticket.assignedTo ?? "UNASSIGNED", disabled: mutation.isPending, onChange: (e) => mutation.mutate({
                                        assignedTo: e.target.value === "UNASSIGNED" ? null : e.target.value,
                                    }), className: SELECT_CLASS, children: [_jsx("option", { value: "UNASSIGNED", children: "Unassigned" }), agents?.map((agent) => (_jsx("option", { value: agent.id, children: agent.name ?? agent.email }, agent.id)))] }), mutation.isPending && (_jsx(Loader2, { className: "absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" }))] })] })] }) }));
}
