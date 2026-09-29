import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@mojadoo/database"
import { z } from "zod"

const schema = z.object({
  modelId: z.string(),
  enabled: z.boolean(),
})

export async function GET() {
  const models = await prisma.aiModelConfig.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json({ data: models })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const model = await prisma.aiModelConfig.update({
    where: { modelId: parsed.data.modelId },
    data: { enabled: parsed.data.enabled },
  })

  return NextResponse.json({ data: model })
}
