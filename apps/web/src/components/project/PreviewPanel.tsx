"use client"

import { Monitor, RefreshCw } from "lucide-react"

interface Props {
  projectId: string
  status: string
  previewUrl?: string | null
}

export default function PreviewPanel({ projectId, status, previewUrl }: Props) {
  const isRunning = status === "RUNNING" || status === "DEPLOYED"
  const url = previewUrl ?? `http://localhost:${3100 + parseInt(projectId.slice(-4), 16) % 900}`

  return (
    <div className="flex-1 bg-muted/30 flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {isRunning ? (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between px-3 py-1.5 bg-card border-b">
              <span className="text-xs text-muted-foreground truncate">{url}</span>
              <button
                onClick={() => {
                  const iframe = document.getElementById("preview-iframe") as HTMLIFrameElement
                  if (iframe) iframe.src = iframe.src
                }}
                className="text-muted-foreground hover:text-foreground ml-2 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <iframe
              id="preview-iframe"
              src={url}
              className="flex-1 border-0 w-full"
              title="App preview"
            />
          </div>
        ) : (
          <div className="text-center px-4">
            <Monitor className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Preview will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">
              {status === "BUILDING" ? "Building your app..." : "Start chatting to build your app"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
