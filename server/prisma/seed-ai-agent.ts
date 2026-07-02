import { Role } from "@prisma/client";
import prisma from "../src/lib/prisma";

async function seed() {
  const agent = await prisma.user.upsert({
    where: { email: "ai@system.local" },
    update: {},
    create: {
      email: "ai@system.local",
      name: "AI",
      role: Role.AGENT,
      emailVerified: true,
    },
  });

  console.log(`AI agent ready: ${agent.email} (id: ${agent.id})`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
