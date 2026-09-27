import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { z } from "zod"

async function getProjectOwned(projectId: string, userId: string) {
  return prisma.project.findFirst({ where: { id: projectId, userId } })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const members = await prisma.teamMember.findMany({
    where: { projectId: params.id },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  })

  return NextResponse.json({ data: members })
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("VIEWER"),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await getProjectOwned(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: "Not found or not owner" }, { status: 404 })

  const body = await req.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const invitee = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!invitee) return NextResponse.json({ error: "User not found. They must sign up first." }, { status: 404 })
  if (invitee.id === session.user.id) return NextResponse.json({ error: "Cannot invite yourself." }, { status: 400 })

  const member = await prisma.teamMember.upsert({
    where: { projectId_userId: { projectId: params.id, userId: invitee.id } },
    update: { role: parsed.data.role },
    create: { projectId: params.id, userId: invitee.id, role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ data: member }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await getProjectOwned(params.id, session.user.id)
  if (!project) return NextResponse.json({ error: "Not found or not owner" }, { status: 404 })

  const { memberId } = await req.json()
  await prisma.teamMember.delete({ where: { id: memberId } })

  return NextResponse.json({ data: { ok: true } })
}
