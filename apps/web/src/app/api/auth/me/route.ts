import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"

export async function GET() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json(null, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  return NextResponse.json({ role: user?.role ?? "USER" })
}
