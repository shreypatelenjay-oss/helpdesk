import { PgBoss } from "pg-boss";

const boss = new PgBoss(process.env.DATABASE_URL!);

boss.on("error", (err) => console.error("[pg-boss]", err));

// In serverless environments there's no long-lived boot sequence that calls boss.start()
// once up front, so every entry point that sends/fetches jobs awaits this instead. It's
// safe to call repeatedly — PgBoss.start() is idempotent and resolves immediately once started.
let startPromise: Promise<PgBoss> | null = null;
export function ensureBossStarted(): Promise<PgBoss> {
  if (!startPromise) {
    startPromise = boss.start().then(() => boss);
  }
  return startPromise;
}

export default boss;
