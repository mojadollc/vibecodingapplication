import { notFound } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import ProjectHeader from "@/components/project/ProjectHeader"
import ProjectBuilder from "@/components/project/ProjectBuilder"

interface Props {
  params: { id: string }
}

export default async function ProjectPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: headers() })
  const userId = session!.user.id

  const [project, user] = await Promise.all([
    prisma.project.findFirst({
      where: { id: params.id, userId },
      include: {
        conversations: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { messages: { orderBy: { createdAt: "asc" } } },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    }),
  ])

  if (!project) notFound()

  const conversation = project.conversations[0] ?? null
  const hasGithub = !!user?.githubAccessToken

  return (
    <div className="flex flex-col h-screen">
      <ProjectHeader project={project} />
      <ProjectBuilder project={project} conversation={conversation} hasGithub={hasGithub} />
    </div>
  )
}
