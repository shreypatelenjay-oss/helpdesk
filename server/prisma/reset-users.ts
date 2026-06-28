import { hashPassword } from "@better-auth/utils/password";
import { Role } from "@prisma/client";
import prisma from "../src/lib/prisma";

const DEFAULT_PASSWORD = "Password123!";

const RANDOM_USERS: { name: string; email: string; role: Role }[] = [
  { name: "Alice Hartman", email: "alice.hartman@example.com", role: Role.ADMIN },
  { name: "Ben Okafor", email: "ben.okafor@example.com", role: Role.AGENT },
  { name: "Clara Nguyen", email: "clara.nguyen@example.com", role: Role.AGENT },
  { name: "David Reyes", email: "david.reyes@example.com", role: Role.AGENT },
  { name: "Eva Svensson", email: "eva.svensson@example.com", role: Role.AGENT },
  { name: "Felix Müller", email: "felix.muller@example.com", role: Role.AGENT },
];

async function run() {
  // Unassign all tickets first (FK constraint)
  await prisma.ticket.updateMany({ data: { assignedTo: null } });

  // Delete all auth data and users
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("All users deleted.");

  const hashed = await hashPassword(DEFAULT_PASSWORD);

  for (const u of RANDOM_USERS) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: true,
        accounts: {
          create: {
            accountId: u.email,
            providerId: "credential",
            password: hashed,
          },
        },
      },
    });
    console.log(`Created ${user.role}: ${user.name} <${user.email}>`);
  }

  console.log(`\nAll users use password: ${DEFAULT_PASSWORD}`);
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
