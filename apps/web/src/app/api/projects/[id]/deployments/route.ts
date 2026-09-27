import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { getDeploymentStatus } from "@/lib/coolify"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, githubRepo: true, githubUrl: true, deployUrl: true, coolifyAppId: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const deployments = await prisma.deployment.findMany({
    where: { projectId: params.id },
    orderBy: { startedAt: "desc" },
    take: 10,
  })

  // Poll Coolify for any RUNNING deployments
  for (const dep of deployments) {
    if (dep.status === "RUNNING" && dep.coolifyDeployId) {
      try {
        const coolifyStatus = await getDeploymentStatus(dep.coolifyDeployId)
        const mapped =
          coolifyStatus.status === "finished" ? "SUCCESS"
          : coolifyStatus.status === "failed" ? "FAILED"
          : "RUNNING"

        if (mapped !== "RUNNING") {
          await prisma.deployment.update({
            where: { id: dep.id },
            data: {
              status: mapped,
              finishedAt: new Date(),
              logs: coolifyStatus.logs ?? null,
            },
          })
          dep.status = mapped as typeof dep.status
        }
      } catch {
        // Coolify not reachable — leave as RUNNING
      }
    }
  }

  return NextResponse.json({ data: { deployments, project } })
}
