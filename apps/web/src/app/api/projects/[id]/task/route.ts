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

  const taskId = req.nextUrl.searchParams.get("taskId")
  if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 })

  const task = await prisma.aiTask.findFirst({
    where: { id: taskId, projectId: params.id },
  })
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // If task is done, also return updated project status
  let projectStatus = null
  if (task.status === "DONE" || task.status === "FAILED") {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { status: true, previewUrl: true },
    })
    projectStatus = project
  }

  return NextResponse.json({ data: { task, projectStatus } })
}
