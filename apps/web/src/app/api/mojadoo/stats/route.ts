import { NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"
import { requireAdmin } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const [users, activeSubs, payments, projects, aiTasks] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
    prisma.project.count(),
    prisma.aiTask.groupBy({ by: ["status"], _count: true }),
  ])

  return NextResponse.json({
    data: {
      users,
      activeSubs,
      totalRevenue: payments._sum.amount ?? 0,
      totalPayments: payments._count,
      projects,
      aiTasks,
    },
  })
}
