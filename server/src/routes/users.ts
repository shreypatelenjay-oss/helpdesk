import { Router } from "express";
import { hashPassword } from "@better-auth/utils/password";
import { createUserSchema, editUserSchema, Role } from "@repo/core";
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
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, role },
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

router.patch("/:id", async (req, res) => {
  const parsed = editUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, email, password, role } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  if (email !== user.email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) return res.status(409).json({ error: "Email already in use" });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, email, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (password) {
    const hashed = await hashPassword(password);
    await prisma.account.updateMany({
      where: { userId: req.params.id, providerId: "credential" },
      data: { password: hashed },
    });
  }

  res.json(updated);
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
