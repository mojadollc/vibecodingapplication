"use client"

import { useState, useEffect, useCallback } from "react"
import { Github, Rocket, ExternalLink, CheckCircle2, XCircle, Loader2, RefreshCw, GitBranch } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import type { Project } from "@mojadoo/database"

interface Deployment {
  id: string
  status: string
  deployUrl: string | null
  commitMsg: string | null
  coolifyDeployId: string | null
  startedAt: string
  finishedAt: string | null
}

interface Props {
  project: Project
  hasGithub: boolean
}

export default function DeployPanel({ project, hasGithub }: Props) {
  const [githubRepo, setGithubRepo] = useState(project.githubRepo ?? "")
  const [githubUrl, setGithubUrl] = useState(project.githubUrl ?? "")
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [pushing, setPushing] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDeployments = useCallback(async () => {
    const res = await fetch(`/api/projects/${project.id}/deployments`)
    const json = await res.json()
    if (json.data?.deployments) setDeployments(json.data.deployments)
  }, [project.id])

  useEffect(() => {
    fetchDeployments()
    const interval = setInterval(fetchDeployments, 5000)
    return () => clearInterval(interval)
  }, [fetchDeployments])

  async function pushToGithub() {
    setPushing(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setGithubRepo(json.data.repo)
      setGithubUrl(json.data.url)
    } finally {
      setPushing(false)
    }
  }

  async function deployToCoolify() {
    setDeploying(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      await fetchDeployments()
    } finally {
      setDeploying(false)
    }
  }

  const latestDeploy = deployments[0]

  return (
    <div className="flex flex-col h-full">
      <div className="h-10 border-b flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Rocket className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Deploy</span>
        </div>
        <button onClick={fetchDeployments} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* GitHub section */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            <span className="text-sm font-medium">GitHub</span>
          </div>

          {githubRepo ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <GitBranch className="w-3 h-3" />
                <a href={githubUrl} target="_blank" rel="noreferrer"
                  className="text-primary hover:underline truncate">
                  {githubRepo}
                </a>
              </div>
              <button
                onClick={pushToGithub}
                disabled={pushing}
                className="w-full py-1.5 rounded-md border text-xs font-medium hover:bg-muted disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {pushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Github className="w-3 h-3" />}
                {pushing ? "Pushing..." : "Push latest changes"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {!hasGithub ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Connect GitHub to push your code</p>
                  <a
                    href="/api/github"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90"
                  >
                    <Github className="w-3 h-3" />
                    Connect GitHub
                  </a>
                </div>
              ) : (
                <button
                  onClick={pushToGithub}
                  disabled={pushing}
                  className="w-full py-1.5 rounded-md bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {pushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Github className="w-3 h-3" />}
                  {pushing ? "Creating repo..." : "Push to GitHub"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Deploy section */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">Coolify Deploy</span>
          </div>

          {latestDeploy?.status === "SUCCESS" && latestDeploy.deployUrl && (
            <a
              href={latestDeploy.deployUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {latestDeploy.deployUrl}
            </a>
          )}

          <button
            onClick={deployToCoolify}
            disabled={deploying || !githubRepo}
            className="w-full py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {deploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
            {deploying ? "Deploying..." : "Deploy to VPS"}
          </button>

          {!githubRepo && (
            <p className="text-xs text-muted-foreground text-center">Push to GitHub first</p>
          )}
        </div>

        {/* Deployment history */}
        {deployments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">History</p>
            {deployments.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between text-xs border rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <StatusIcon status={dep.status} />
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(dep.startedAt), { addSuffix: true })}
                  </span>
                </div>
                <span className={cn(
                  "capitalize font-medium",
                  dep.status === "SUCCESS" && "text-green-500",
                  dep.status === "FAILED" && "text-destructive",
                  dep.status === "RUNNING" && "text-yellow-500",
                )}>
                  {dep.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "SUCCESS") return <CheckCircle2 className="w-3 h-3 text-green-500" />
  if (status === "FAILED") return <XCircle className="w-3 h-3 text-destructive" />
  return <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
}
