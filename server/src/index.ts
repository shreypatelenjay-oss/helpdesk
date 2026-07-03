import app from "./app";
import { ensureBossStarted } from "./lib/boss";
import { CLASSIFY_QUEUE, classifyTicketWorker } from "./lib/classifyTicket";
import { AUTO_RESOLVE_QUEUE, autoResolveTicketWorker } from "./lib/autoResolveTicket";
import { IMAP_POLL_QUEUE, imapPollWorker } from "./lib/imapPoll";

const PORT = process.env.PORT ?? 8000;

ensureBossStarted().then(async (boss) => {
  await boss.createQueue(CLASSIFY_QUEUE);
  await boss.work(CLASSIFY_QUEUE, classifyTicketWorker);
  await boss.createQueue(AUTO_RESOLVE_QUEUE);
  await boss.work(AUTO_RESOLVE_QUEUE, autoResolveTicketWorker);
  await boss.createQueue(IMAP_POLL_QUEUE);
  await boss.work(IMAP_POLL_QUEUE, imapPollWorker);
  await boss.schedule(IMAP_POLL_QUEUE, "*/2 * * * *", {});
  console.log("[pg-boss] workers ready");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
