import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"
import { requireAdmin } from "@/lib/admin-guard"
import { z } from "zod"

const schema = z.object({
  planId: z.string(),
  credits: z.number().int().positive().optional(),
  priceMonthly: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { planId, ...data } = parsed.data
  const plan = await prisma.subscriptionPlan.update({ where: { id: planId }, data })

  return NextResponse.json({ data: plan })
}
