import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import ProjectCard from "@/components/project/ProjectCard"
import NewProjectButton from "@/components/project/NewProjectButton"
import CreditBadge from "@/components/layout/CreditBadge"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: headers() })
  const userId = session!.user.id

  const [projects, wallet] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.creditWallet.findUnique({ where: { userId } }),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreditBadge balance={wallet?.balance ?? 0} />
          <NewProjectButton />
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl text-center">
          <p className="text-muted-foreground">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
