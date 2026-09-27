import Link from "next/link"
import { ChevronLeft, Circle, Github, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project } from "@mojadoo/database"
import ModelSelector from "@/components/project/ModelSelector"

const statusColors: Record<string, string> = {
  IDLE: "text-muted-foreground",
  BUILDING: "text-yellow-500",
  RUNNING: "text-green-500",
  ERROR: "text-destructive",
  DEPLOYED: "text-blue-500",
}

interface Props {
  project: Project
}

export default function ProjectHeader({ project }: Props) {
  return (
    <header className="h-12 border-b flex items-center px-4 gap-3 bg-card shrink-0">
      <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4" />
      </Link>

      <div className="flex items-center gap-2">
        <Circle className={cn("w-2 h-2 fill-current", statusColors[project.status])} />
        <span className="text-sm font-medium">{project.name}</span>
        <span className="text-xs text-muted-foreground capitalize">{project.status.toLowerCase()}</span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ModelSelector projectId={project.id} currentModel={project.aiModel ?? "gpt-4o"} />
        {project.githubRepo && (
          <a
            href={project.githubUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Github className="w-3.5 h-3.5" />
            {project.githubRepo}
          </a>
        )}
        {project.deployUrl && (
          <a
            href={project.deployUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Live
          </a>
        )}
      </div>
    </header>
  )
}
