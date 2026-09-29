import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { z } from "zod"

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  return user?.role === "ADMIN" ? session : null
}

const schema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1).max(300),
  category: z.string().min(1).max(50),
  icon: z.string().min(1).max(50),
  prompt: z.string(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
})

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const templates = await prisma.projectTemplate.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json({ data: templates })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const template = await prisma.projectTemplate.create({ data: parsed.data })
  return NextResponse.json({ data: template }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const template = await prisma.projectTemplate.update({ where: { id }, data: rest })
  return NextResponse.json({ data: template })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await prisma.projectTemplate.delete({ where: { id } })
  return NextResponse.json({ data: { ok: true } })
}
