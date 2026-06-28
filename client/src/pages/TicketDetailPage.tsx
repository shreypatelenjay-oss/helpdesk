import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { createReplySchema, type Ticket, type Reply } from "@repo/core";

type ReplyFormValues = z.infer<typeof createReplySchema>;


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

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { body: "" },
  });

  const sendReply = useMutation({
    mutationFn: (values: ReplyFormValues) =>
      axios.post<Reply>(`/api/tickets/${id}/reply`, values).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      replyForm.reset();
    },
  });

  if (isPending) {
    return <TicketDetailSkeleton />;
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
        {/* Back button */}
        <div>
          <Link to="/tickets" className="hover:no-underline">
            <Button variant="outline" size="sm" className="gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" /> Back to Tickets
            </Button>
          </Link>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-6">
            <TicketDetail ticket={ticket} />

            {/* Reply Thread */}
            <Card className="shadow-xs border-gray-200/80">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-950 border-b border-gray-100 pb-3">
                  Replies
                </h3>

                {ticket.replies.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No replies yet.</p>
                ) : (
                  <div className="space-y-3" data-testid="reply-thread">
                    {ticket.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`flex ${reply.senderType === "AGENT" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                            reply.senderType === "AGENT"
                              ? "bg-primary text-primary-foreground"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {reply.bodyHTML ? (
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.bodyHTML) }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap">{DOMPurify.sanitize(reply.body, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })}</p>
                          )}
                          <p
                            className={`mt-1.5 text-xs ${
                              reply.senderType === "AGENT" ? "text-primary-foreground/70" : "text-gray-400"
                            }`}
                          >
                            {reply.senderType === "AGENT" ? "Agent" : "Customer"} ·{" "}
                            {new Date(reply.sentAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form */}
                <form
                  onSubmit={replyForm.handleSubmit((values) => sendReply.mutate(values))}
                  className="space-y-3 pt-2 border-t border-gray-100"
                >
                  <Textarea
                    {...replyForm.register("body")}
                    placeholder="Write a reply…"
                    rows={3}
                    maxLength={5000}
                    aria-invalid={!!replyForm.formState.errors.body}
                    disabled={sendReply.isPending}
                    data-testid="reply-input"
                  />
                  {replyForm.formState.errors.body && (
                    <p className="text-xs text-destructive">{replyForm.formState.errors.body.message}</p>
                  )}
                  {sendReply.isError && (
                    <p className="text-xs text-destructive">
                      {axiosError(sendReply.error, "Failed to send reply")}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={sendReply.isPending} className="gap-2" data-testid="reply-submit">
                      {sendReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send Reply
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Attributes */}
          <div className="space-y-6">
            <UpdateTicket ticketId={id!} ticket={ticket} />
          </div>
        </div>
      </div>
    </div>
  );
}
