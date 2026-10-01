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
  planId: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { userId, role, addCredits, planId } = parsed.data

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

  if (planId) {
    // "free" is a special slug meaning cancel all paid subscriptions
    if (planId === "free") {
      await prisma.subscription.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      })
    } else {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
      if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      await prisma.subscription.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "CANCELLED" },
      })
      await prisma.subscription.create({
        data: {
          userId,
          planId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  return NextResponse.json({ data: { ok: true } })
}
