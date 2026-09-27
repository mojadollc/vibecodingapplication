import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { getOrCreateRepo, pushFiles, getAuthenticatedUser } from "@/lib/github"
import {
  generateDockerfile,
  generateDockerCompose,
  generateNextConfigForDocker,
  generateDockerignore,
} from "@/lib/docker-templates"
import { z } from "zod"

const schema = z.object({
  repoName: z.string().min(1).max(100).optional(),
  isPrivate: z.boolean().default(true),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user?.githubAccessToken) {
    return NextResponse.json({ error: "GitHub not connected. Please connect your GitHub account." }, { status: 400 })
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { files: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (project.files.length === 0) {
    return NextResponse.json({ error: "No files to push. Build your app first." }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const repoName = parsed.success && parsed.data.repoName
    ? parsed.data.repoName
    : project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")

  try {
    const ghUser = await getAuthenticatedUser(user.githubAccessToken)
    const repo = await getOrCreateRepo(
      user.githubAccessToken,
      repoName,
      project.description ?? `Built with Mojadoo Builder`
    )

    // Build file list: project files + Docker files
    const filesToPush: { path: string; content: string }[] = [
      ...project.files.map((f) => ({ path: f.path, content: f.content })),
      { path: "Dockerfile", content: generateDockerfile() },
      { path: "docker-compose.yml", content: generateDockerCompose(project.name) },
      { path: ".dockerignore", content: generateDockerignore() },
      { path: "next.config.js", content: generateNextConfigForDocker() },
    ]

    const commitSha = await pushFiles(
      user.githubAccessToken,
      ghUser.login,
      repoName,
      filesToPush,
      "main",
      `feat: sync from Mojadoo Builder`
    )

    // Save repo info to project
    await prisma.project.update({
      where: { id: project.id },
      data: {
        githubRepo: repo.fullName,
        githubUrl: repo.htmlUrl,
        status: "RUNNING",
      },
    })

    return NextResponse.json({
      data: {
        repo: repo.fullName,
        url: repo.htmlUrl,
        commitSha,
        filesCount: filesToPush.length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { githubRepo: true, githubUrl: true },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ data: project })
}
