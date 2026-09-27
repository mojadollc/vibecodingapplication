import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const filePath = req.nextUrl.searchParams.get("path")

  if (filePath) {
    const file = await prisma.projectFile.findUnique({
      where: { projectId_path: { projectId: params.id, path: filePath } },
    })
    return NextResponse.json({ data: file?.content ?? "" })
  }

  const files = await prisma.projectFile.findMany({
    where: { projectId: params.id },
    select: { path: true, updatedAt: true },
    orderBy: { path: "asc" },
  })

  return NextResponse.json({ data: files.map((f) => f.path) })
}
