import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { createApplication, triggerDeploy, getApplication } from "@/lib/coolify"
import { z } from "zod"

const schema = z.object({
  domain: z.string().optional(),
  serverUuid: z.string().optional(),
  environmentName: z.string().default("production"),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!project.githubRepo) {
    return NextResponse.json({ error: "Push to GitHub first before deploying." }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const { domain, serverUuid, environmentName } = parsed.success ? parsed.data : schema.parse({})

  const coolifyServerUuid = serverUuid ?? process.env.COOLIFY_SERVER_UUID ?? ""
  if (!coolifyServerUuid) {
    return NextResponse.json({ error: "COOLIFY_SERVER_UUID not configured." }, { status: 500 })
  }

  try {
    // Create or reuse Coolify app
    let appUuid = project.coolifyAppId
    if (!appUuid) {
      const app = await createApplication({
        name: project.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        serverUuid: coolifyServerUuid,
        environmentName,
        githubRepo: project.githubRepo,
        branch: "main",
        buildPack: "dockerfile",
        port: 3000,
        domain,
      })
      appUuid = app.uuid
      await prisma.project.update({
        where: { id: project.id },
        data: { coolifyAppId: appUuid },
      })
    }

    // Trigger deployment
    const deployResult = await triggerDeploy(appUuid)

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId: project.id,
        status: "RUNNING",
        provider: "coolify",
        coolifyDeployId: deployResult.uuid,
        commitMsg: "Deploy from Mojadoo Builder",
      },
    })

    // Update project status
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "DEPLOYED" },
    })

    return NextResponse.json({ data: { deploymentId: deployment.id, coolifyDeployId: deployResult.uuid } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
