"use client"

import { useState } from "react"
import type { Project, Conversation, Message } from "@mojadoo/database"
import ChatPanel from "@/components/chat/ChatPanel"
import FileExplorer from "@/components/project/FileExplorer"
import PreviewPanel from "@/components/project/PreviewPanel"
import DeployPanel from "@/components/deploy/DeployPanel"
import { Monitor, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  project: Project
  conversation: (Conversation & { messages: Message[] }) | null
  hasGithub: boolean
}

type RightTab = "preview" | "deploy"

export default function ProjectBuilder({ project, conversation, hasGithub }: Props) {
  const [fileRefreshTrigger, setFileRefreshTrigger] = useState(0)
  const [projectStatus, setProjectStatus] = useState(project.status)
  const [rightTab, setRightTab] = useState<RightTab>("preview")

  return (
    <div className="flex flex-1 overflow-hidden">
      <ChatPanel
        project={project}
        conversation={conversation}
        onFilesChanged={() => setFileRefreshTrigger((n) => n + 1)}
        onProjectStatusChanged={(s) => setProjectStatus(s as typeof projectStatus)}
      />
      <FileExplorer projectId={project.id} refreshTrigger={fileRefreshTrigger} />

      {/* Right panel with tab switcher */}
      <div className="flex-1 flex flex-col border-l min-w-0">
        {/* Tab bar */}
        <div className="h-10 border-b flex items-center bg-card shrink-0">
          {(["preview", "deploy"] as RightTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRightTab(tab)}
              className={cn(
                "flex items-center gap-1.5 px-4 h-full text-xs font-medium border-b-2 transition-colors",
                rightTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "preview" ? <Monitor className="w-3.5 h-3.5" /> : <Rocket className="w-3.5 h-3.5" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {rightTab === "preview" ? (
            <PreviewPanel
              projectId={project.id}
              status={projectStatus}
              previewUrl={project.previewUrl}
            />
          ) : (
            <DeployPanel project={project} hasGithub={hasGithub} />
          )}
        </div>
      </div>
    </div>
  )
}
