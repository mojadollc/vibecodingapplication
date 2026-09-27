import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  framework: z.string().default("nextjs"),
})

export async function GET() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ data: projects })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      framework: parsed.data.framework,
    },
  })

  // Create initial conversation for the project
  await prisma.conversation.create({ data: { projectId: project.id } })

  // Ensure credit wallet exists
  await prisma.creditWallet.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id, balance: 50, lifetimeCredits: 50 },
  })

  return NextResponse.json({ data: project }, { status: 201 })
}
