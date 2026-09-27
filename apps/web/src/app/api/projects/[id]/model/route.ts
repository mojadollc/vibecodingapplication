import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { z } from "zod"

const ALLOWED_MODELS = ["gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022", "gemini-1.5-pro"]

const schema = z.object({
  model: z.string().refine((m) => ALLOWED_MODELS.includes(m), { message: "Invalid model" }),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.project.update({
    where: { id: params.id },
    data: { aiModel: parsed.data.model },
  })

  return NextResponse.json({ data: { model: parsed.data.model } })
}
