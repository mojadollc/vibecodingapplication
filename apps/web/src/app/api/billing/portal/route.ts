import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"

export async function GET() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [subscription, wallet, payments] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditWallet.findUnique({ where: { userId: session.user.id } }),
    prisma.payment.findMany({
      where: { userId: session.user.id, status: "PAID" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  return NextResponse.json({ data: { subscription, wallet, payments } })
}

export async function DELETE() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.subscription.updateMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    data: { cancelAtPeriodEnd: true },
  })

  return NextResponse.json({ data: { cancelled: true } })
}
