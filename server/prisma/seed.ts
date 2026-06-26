import { hashPassword } from "@better-auth/utils/password";
import { Role } from "@prisma/client";
import prisma from "../src/lib/prisma";

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.SEED_ADMIN_PASSWORD ?? "password123";
const roleInput = process.env.SEED_ADMIN_ROLE ?? Role.ADMIN;

if (!(roleInput in Role)) {
  console.error(`Invalid role "${roleInput}". Must be one of: ${Object.values(Role).join(", ")}`);
  process.exit(1);
}

const role = roleInput as Role;

async function seed() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists, skipping.`);
    return;
  }

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      role,
      emailVerified: true,
      accounts: {
        create: {
          accountId: email,
          providerId: "credential",
          password: hashed,
        },
      },
    },
  });

  console.log(`Created ${role} user: ${user.email} (id: ${user.id})`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
