import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"
import { requireAdmin } from "@/lib/admin-guard"
import { z } from "zod"

export async function GET() {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creditWallet: { select: { balance: true, usedCredits: true } },
      subscriptions: { where: { status: "ACTIVE" }, include: { plan: { select: { name: true } } }, take: 1 },
      _count: { select: { projects: true } },
    },
  })

  return NextResponse.json({ data: users })
}

const patchSchema = z.object({
  userId: z.string(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  addCredits: z.number().int().positive().optional(),
})

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { userId, role, addCredits } = parsed.data

  if (role) {
    await prisma.user.update({ where: { id: userId }, data: { role } })
  }

  if (addCredits) {
    const wallet = await prisma.creditWallet.upsert({
      where: { userId },
      update: { balance: { increment: addCredits }, lifetimeCredits: { increment: addCredits } },
      create: { userId, balance: addCredits, lifetimeCredits: addCredits },
    })
    await prisma.creditTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: addCredits,
        balanceAfter: wallet.balance + addCredits,
        description: "Admin credit grant",
      },
    })
  }

  return NextResponse.json({ data: { ok: true } })
}
