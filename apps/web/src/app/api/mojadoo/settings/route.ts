import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"
import { prisma } from "@mojadoo/database"

export async function GET() {
  const configs = await prisma.systemConfig.findMany()
  const data = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const { settings } = await req.json() as { settings: Record<string, string> }

  await Promise.all(
    Object.entries(settings).map(([key, value]) =>
      prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  return NextResponse.json({ message: "Settings saved!" })
}
