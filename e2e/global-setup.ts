import { execSync } from "child_process";
import path from "path";
import { config } from "dotenv";

const serverDir = path.resolve(__dirname, "../server");
const testEnv = config({ path: path.resolve(serverDir, ".env.test") }).parsed!;

// Merge test env on top of process.env so DATABASE_URL overrides what
// Prisma's CLI would auto-load from server/.env
const env = { ...process.env, ...testEnv };

async function globalSetup() {
  console.log("[e2e] Running prisma migrate deploy on test database...");
  execSync("bunx prisma migrate deploy", { cwd: serverDir, stdio: "inherit", env });

  console.log("[e2e] Seeding test database...");
  execSync("bun run prisma/seed.ts", { cwd: serverDir, stdio: "inherit", env });

  console.log("[e2e] Test database ready.");
}

export default globalSetup;
