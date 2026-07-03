import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { ArrowLeft, Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
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
  const [summary, setSummary] = React.useState<string | null>(null);

  const { data: ticket, isPending, error } = useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<Ticket>(`/api/tickets/${id}`).then((r) => r.data),
  });

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { body: "" },
  });

  const polishReply = useMutation({
    mutationFn: (body: string) =>
      axios.post<{ polished: string }>("/api/tickets/polish-reply", { body }).then((r) => r.data),
    onSuccess: (data) => {
      replyForm.setValue("body", data.polished);
    },
  });

  const sendReply = useMutation({
    mutationFn: (values: ReplyFormValues) =>
      axios.post<Reply>(`/api/tickets/${id}/reply`, values).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      replyForm.reset();
    },
  });

  const summarize = useMutation({
    mutationFn: () =>
      axios.post<{ summary: string }>(`/api/tickets/${id}/summarize`).then((r) => r.data),
    onSuccess: (data) => setSummary(data.summary),
  });

  if (isPending) {
    return <TicketDetailSkeleton />;
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background md:pl-60" data-testid="detail-error">
        <Navbar />
        <div className="max-w-5xl mx-auto p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Ticket not found</h2>
          <p className="text-muted-foreground">
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
    <div className="min-h-screen bg-background md:pl-60" data-testid="detail-container">
      <Navbar />
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        {/* Back button */}
        <div>
          <Link to="/tickets" className="hover:no-underline">
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Tickets
            </Button>
          </Link>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-6">
            <TicketDetail ticket={ticket} />

            {/* Summarize */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => summarize.mutate()}
                disabled={summarize.isPending}
                data-testid="summarize-btn"
              >
                {summarize.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : summary ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {summary ? "Re-generate Summary" : "Summarize"}
              </Button>

              {summarize.isError && (
                <p className="text-xs text-destructive">
                  {axiosError(summarize.error, "Failed to generate summary")}
                </p>
              )}

              {summary && (
                <Card className="py-0 gap-0 shadow-xs ring-primary/20 bg-accent/40">
                  <div className="flex items-center gap-2 border-b border-primary/15 px-5 py-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">AI Summary</h4>
                  </div>
                  <CardContent className="px-5 py-4 text-sm leading-relaxed text-foreground/90">{summary}</CardContent>
                </Card>
              )}
            </div>

            {/* Reply Thread */}
            <Card className="py-0 gap-0 shadow-xs">
              <div className="border-b border-border bg-muted/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Replies
              </div>
              <CardContent className="px-5 py-4 space-y-4">

                {ticket.replies.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 text-center py-6">No replies yet.</p>
                ) : (
                  <div className="space-y-5" data-testid="reply-thread">
                    {ticket.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <span
                          className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                            reply.senderType === "AGENT"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          aria-hidden
                        >
                          {reply.senderType === "AGENT" ? "A" : "C"}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground tabular-nums">
                            {reply.senderType === "AGENT" ? "Agent" : "Customer"} ·{" "}
                            {new Date(reply.sentAt).toLocaleString()}
                          </p>
                          <div
                            className={`rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${
                              reply.senderType === "AGENT"
                                ? "border-primary/20 bg-accent/50 text-foreground"
                                : "border-border bg-background text-foreground/90"
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply form */}
                <form
                  onSubmit={replyForm.handleSubmit((values) => sendReply.mutate(values))}
                  className="space-y-3 pt-4 border-t border-border"
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
                  {polishReply.isError && (
                    <p className="text-xs text-destructive">
                      {axiosError(polishReply.error, "Failed to polish reply")}
                    </p>
                  )}
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      disabled={!replyForm.watch("body") || polishReply.isPending || sendReply.isPending}
                      onClick={() => polishReply.mutate(replyForm.getValues("body"))}
                      data-testid="reply-polish"
                    >
                      {polishReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Polish
                    </Button>
                    <Button type="submit" disabled={sendReply.isPending || !replyForm.watch("body")} className="gap-2" data-testid="reply-submit">
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
