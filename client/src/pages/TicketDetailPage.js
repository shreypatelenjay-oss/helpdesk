import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { TicketDetail } from "../components/TicketDetail";
import { TicketDetailSkeleton } from "../components/TicketDetailSkeleton";
import { UpdateTicket } from "../components/UpdateTicket";
import DOMPurify from "dompurify";
import { createReplySchema } from "@repo/core";
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
    const replyForm = useForm({
        resolver: zodResolver(createReplySchema),
        defaultValues: { body: "" },
    });
    const sendReply = useMutation({
        mutationFn: (values) => axios.post(`/api/tickets/${id}/reply`, values).then((r) => r.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["ticket", id] });
            replyForm.reset();
        },
    });
    if (isPending) {
        return _jsx(TicketDetailSkeleton, {});
    }
    if (error || !ticket) {
        return (_jsxs("div", { className: "min-h-screen bg-gray-50", "data-testid": "detail-error", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8 text-center space-y-4", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Ticket not found" }), _jsx("p", { className: "text-gray-500", children: error ? axiosError(error, "Failed to load ticket details") : "The requested ticket does not exist." }), _jsx(Link, { to: "/tickets", className: "hover:no-underline", children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Back to Tickets"] }) })] })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", "data-testid": "detail-container", children: [_jsx(Navbar, {}), _jsxs("div", { className: "max-w-5xl mx-auto p-8 space-y-6", children: [_jsx("div", { children: _jsx(Link, { to: "/tickets", className: "hover:no-underline", children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-600 hover:text-gray-900", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), " Back to Tickets"] }) }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 items-start", children: [_jsxs("div", { className: "md:col-span-2 space-y-6", children: [_jsx(TicketDetail, { ticket: ticket }), _jsx(Card, { className: "shadow-xs border-gray-200/80", children: _jsxs(CardContent, { className: "p-6 space-y-4", children: [_jsx("h3", { className: "text-lg font-bold text-gray-950 border-b border-gray-100 pb-3", children: "Replies" }), ticket.replies.length === 0 ? (_jsx("p", { className: "text-sm text-gray-400 text-center py-4", children: "No replies yet." })) : (_jsx("div", { className: "space-y-3", "data-testid": "reply-thread", children: ticket.replies.map((reply) => (_jsx("div", { className: `flex ${reply.senderType === "AGENT" ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${reply.senderType === "AGENT"
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-gray-100 text-gray-800"}`, children: [reply.bodyHTML ? (_jsx("div", { className: "prose prose-sm max-w-none", dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(reply.bodyHTML) } })) : (_jsx("p", { className: "whitespace-pre-wrap", children: DOMPurify.sanitize(reply.body, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) })), _jsxs("p", { className: `mt-1.5 text-xs ${reply.senderType === "AGENT" ? "text-primary-foreground/70" : "text-gray-400"}`, children: [reply.senderType === "AGENT" ? "Agent" : "Customer", " \u00B7", " ", new Date(reply.sentAt).toLocaleString()] })] }) }, reply.id))) })), _jsxs("form", { onSubmit: replyForm.handleSubmit((values) => sendReply.mutate(values)), className: "space-y-3 pt-2 border-t border-gray-100", children: [_jsx(Textarea, { ...replyForm.register("body"), placeholder: "Write a reply\u2026", rows: 3, maxLength: 5000, "aria-invalid": !!replyForm.formState.errors.body, disabled: sendReply.isPending, "data-testid": "reply-input" }), replyForm.formState.errors.body && (_jsx("p", { className: "text-xs text-destructive", children: replyForm.formState.errors.body.message })), sendReply.isError && (_jsx("p", { className: "text-xs text-destructive", children: axiosError(sendReply.error, "Failed to send reply") })), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { type: "submit", disabled: sendReply.isPending, className: "gap-2", "data-testid": "reply-submit", children: [sendReply.isPending ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : _jsx(Send, { className: "h-4 w-4" }), "Send Reply"] }) })] })] }) })] }), _jsx("div", { className: "space-y-6", children: _jsx(UpdateTicket, { ticketId: id, ticket: ticket }) })] })] })] }));
}
