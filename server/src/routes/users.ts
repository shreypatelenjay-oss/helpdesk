import { Router } from "express";
import { hashPassword } from "@better-auth/utils/password";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

router.post("/", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  if (role && role !== "ADMIN" && role !== "AGENT") {
    return res.status(400).json({ error: "role must be ADMIN or AGENT" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name: name ?? null, email, role: role ?? "AGENT" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: hashed,
    },
  });

  res.status(201).json(user);
});

router.delete("/:id", async (req, res) => {
  const adminUser = (req as any).user;
  if (adminUser.id === req.params.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
