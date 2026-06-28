import axios from "axios";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
import type { Ticket, Agent } from "@repo/core";

type Props = {
  ticketId: string;
  ticket: Ticket;
};

function axiosError(e: unknown, fallback: string) {
  return axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : fallback;
}

const SELECT_CLASS =
  "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-50 transition-all";

export function UpdateTicket({ ticketId, ticket }: Props) {
  const qc = useQueryClient();

  const { data: agents } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: () => axios.get<Agent[]>("/api/users/agents").then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<Ticket>) =>
      axios.patch(`/api/tickets/${ticketId}`, body).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", ticketId], (prev: any) => ({ ...prev, ...updated }));
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return (
    <Card className="shadow-xs border-gray-200/80">
      <CardContent className="p-6 space-y-5">
        <h3 className="text-lg font-bold text-gray-950 border-b border-gray-100 pb-3">
          Ticket Attributes
        </h3>

        {mutation.isError && (
          <p className="text-xs text-destructive">
            {axiosError(mutation.error, "Failed to update attributes")}
          </p>
        )}

        {/* Status */}
        <div className="space-y-1.5">
          <label htmlFor="ticket-status-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Status
          </label>
          <div className="relative">
            <select
              id="ticket-status-select"
              value={ticket.status}
              disabled={mutation.isPending}
              onChange={(e) => mutation.mutate({ status: e.target.value as Ticket["status"] })}
              className={SELECT_CLASS}
            >
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            {mutation.isPending && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label htmlFor="ticket-category-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Category
          </label>
          <div className="relative">
            <select
              id="ticket-category-select"
              value={ticket.category ?? "UNASSIGNED"}
              disabled={mutation.isPending}
              onChange={(e) =>
                mutation.mutate({
                  category: e.target.value === "UNASSIGNED" ? null : (e.target.value as Ticket["category"]),
                })
              }
              className={SELECT_CLASS}
            >
              <option value="UNASSIGNED">Unassigned</option>
              <option value="GENERAL_QUESTION">General</option>
              <option value="TECHNICAL_QUESTION">Technical</option>
              <option value="REFUND_REQUEST">Refund</option>
            </select>
            {mutation.isPending && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        {/* Assigned Agent */}
        <div className="space-y-1.5">
          <label htmlFor="ticket-assignee-select" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Assigned Agent
          </label>
          <div className="relative">
            <select
              id="ticket-assignee-select"
              value={ticket.assignedTo ?? "UNASSIGNED"}
              disabled={mutation.isPending}
              onChange={(e) =>
                mutation.mutate({
                  assignedTo: e.target.value === "UNASSIGNED" ? null : e.target.value,
                })
              }
              className={SELECT_CLASS}
            >
              <option value="UNASSIGNED">Unassigned</option>
              {agents?.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name ?? agent.email}
                </option>
              ))}
            </select>
            {mutation.isPending && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
