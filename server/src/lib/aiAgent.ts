import prisma from "./prisma";

export async function getAIAgent() {
  return prisma.user.findUniqueOrThrow({ where: { email: "ai@system.local" } });
}
