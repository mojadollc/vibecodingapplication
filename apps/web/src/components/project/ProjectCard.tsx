import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project } from "@mojadoo/database"

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

export default function ProjectCard({ project }: Props) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-sm truncate">{project.name}</h3>
          <Circle className={cn("w-2.5 h-2.5 fill-current mt-0.5 shrink-0", statusColors[project.status])} />
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="capitalize">{project.framework}</span>
          <span>{formatDistanceToNow(project.updatedAt, { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  )
}
