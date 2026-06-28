import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";

type Agent = {
  id: string;
  name: string | null;
  email: string;
};

type Ticket = {
  id: string;
  subject: string;
  body: string;
  senderEmail: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
  category: "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST" | null;
  createdAt: string;
  assignedTo: string | null;
  agent: Agent | null;
};

const STATUS_STYLES = {
  OPEN: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-green-100 text-green-700 border-green-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABELS = {
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

function axiosError(e: unknown, fallback: string) {
  return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: ticket, isPending, error } = useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<Ticket>(`/api/tickets/${id}`).then((r) => r.data),
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: () => axios.get<Agent[]>("/api/users/agents").then((r) => r.data),
  });

  const updateTicket = useMutation({
    mutationFn: (body: Partial<Ticket>) =>
      axios.patch<Ticket>(`/api/tickets/${id}`, body).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", id], updated);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50" data-testid="detail-loading">
        <Navbar />
        <div className="max-w-5xl mx-auto p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50" data-testid="detail-error">
        <Navbar />
        <div className="max-w-5xl mx-auto p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Ticket not found</h2>
          <p className="text-gray-500">
            {error ? axiosError(error, "Failed to load ticket details") : "The requested ticket does not exist."}
          </p>
          <Link to="/tickets" className="hover:no-underline">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Tickets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="detail-container">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/tickets" className="hover:no-underline">
            <Button variant="outline" size="sm" className="gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" /> Back to Tickets
            </Button>
          </Link>

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

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Main Description */}
          <div className="md:col-span-2 space-y-6">
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

          {/* Sidebar Attributes */}
          <div className="space-y-6">
            <Card className="shadow-xs border-gray-200/80">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-lg font-bold text-gray-950 border-b border-gray-100 pb-3">
                  Ticket Attributes
                </h3>

                {updateTicket.isError && (
                  <p className="text-xs text-destructive">
                    {axiosError(updateTicket.error, "Failed to update attributes")}
                  </p>
                )}

                {/* Status selector */}
                <div className="space-y-1.5">
                  <label htmlFor="ticket-status-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      id="ticket-status-select"
                      value={ticket.status}
                      disabled={updateTicket.isPending}
                      onChange={(e) => updateTicket.mutate({ status: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <option value="OPEN">Open</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    {updateTicket.isPending && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Category selector */}
                <div className="space-y-1.5">
                  <label htmlFor="ticket-category-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      id="ticket-category-select"
                      value={ticket.category ?? "UNASSIGNED"}
                      disabled={updateTicket.isPending}
                      onChange={(e) =>
                        updateTicket.mutate({
                          category: e.target.value === "UNASSIGNED" ? null : (e.target.value as any),
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <option value="UNASSIGNED">Unassigned</option>
                      <option value="GENERAL_QUESTION">General</option>
                      <option value="TECHNICAL_QUESTION">Technical</option>
                      <option value="REFUND_REQUEST">Refund</option>
                    </select>
                    {updateTicket.isPending && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Assignee selector */}
                <div className="space-y-1.5">
                  <label htmlFor="ticket-assignee-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assigned Agent
                  </label>
                  <div className="relative">
                    <select
                      id="ticket-assignee-select"
                      value={ticket.assignedTo ?? "UNASSIGNED"}
                      disabled={updateTicket.isPending}
                      onChange={(e) =>
                        updateTicket.mutate({
                          assignedTo: e.target.value === "UNASSIGNED" ? null : e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <option value="UNASSIGNED">Unassigned</option>
                      {agents?.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name ?? agent.email}
                        </option>
                      ))}
                    </select>
                    {updateTicket.isPending && (
                      <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
