import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { NextResponse } from "next/server"

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { userId: session.user.id }
}
