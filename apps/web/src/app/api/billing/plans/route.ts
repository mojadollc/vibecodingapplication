import { NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"

export const dynamic = "force-dynamic"

export async function GET() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json({ data: plans })
}
