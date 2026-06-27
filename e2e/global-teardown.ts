import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";

const serverDir = path.resolve(__dirname, "../server");
const testEnv = config({ path: path.resolve(serverDir, ".env.test") }).parsed!;

const env = { ...process.env, ...testEnv };

async function globalTeardown() {
  // In UI mode or local dev, skip destructive teardown — the DB stays seeded
  // for subsequent runs. Only reset in CI where a clean state is required.
  if (!process.env.CI) return;

  console.log("[e2e] Resetting test database...");
  execSync("bunx prisma migrate reset --force --skip-seed", { cwd: serverDir, stdio: "inherit", env });
  console.log("[e2e] Test database reset complete.");
}

export default globalTeardown;
