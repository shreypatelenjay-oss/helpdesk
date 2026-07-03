import { Router } from "express";
import * as Sentry from "@sentry/node";
import { ensureBossStarted } from "../lib/boss";
import { requireCronSecret } from "../middleware/requireCronSecret";
import { CLASSIFY_QUEUE, classifyTicketWorker } from "../lib/classifyTicket";
import { AUTO_RESOLVE_QUEUE, autoResolveTicketWorker } from "../lib/autoResolveTicket";
import { imapPollWorker } from "../lib/imapPoll";

const router = Router();

// Serverless stand-in for pg-boss's persistent `.work()` listeners (see server/src/index.ts,
// used by the Docker/Railway deployment). Vercel Functions can't run a long-lived worker loop,
// so a Vercel Cron job hits this endpoint on an interval to drain pending queue jobs instead.
async function drainQueue<T>(
  queueName: string,
  worker: (jobs: import("pg-boss").Job<T>[]) => Promise<void>
) {
  const boss = await ensureBossStarted();
  let processed = 0;
  for (;;) {
    const [job] = await boss.fetch<T>(queueName);
    if (!job) break;
    try {
      await worker([job]);
      await boss.complete(queueName, job.id);
    } catch (err) {
      console.error(`[cron] job ${job.id} on ${queueName} failed:`, err);
      Sentry.captureException(err, { tags: { route: "cron/drain-jobs", queue: queueName } });
      await boss.fail(queueName, job.id);
    }
    processed++;
  }
  return processed;
}

// Vercel Cron always sends GET requests.
router.get("/drain-jobs", requireCronSecret, async (_req, res) => {
  const [classified, autoResolved] = await Promise.all([
    drainQueue(CLASSIFY_QUEUE, classifyTicketWorker),
    drainQueue(AUTO_RESOLVE_QUEUE, autoResolveTicketWorker),
  ]);

  let imapPolled = true;
  let imapError: string | undefined;
  try {
    await imapPollWorker([{} as never]);
  } catch (err) {
    imapPolled = false;
    imapError = err instanceof Error ? err.message : String(err);
    console.error("[cron] imapPollWorker failed:", err);
    Sentry.captureException(err, { tags: { route: "cron/drain-jobs", queue: "imap-poll" } });
  }

  res.json({ classified, autoResolved, imapPolled, imapError });
});

export default router;
