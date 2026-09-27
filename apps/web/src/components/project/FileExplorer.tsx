"use client"

import { useState, useEffect, useCallback } from "react"
import { FileCode, ChevronRight, ChevronDown, Folder, FolderOpen, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  projectId: string
  refreshTrigger?: number
}

interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[]
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const filePath of paths) {
    const parts = filePath.split("/")
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const existing = current.find((n) => n.name === part)

      if (existing) {
        current = existing.children
      } else {
        const node: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDir: !isLast,
          children: [],
        }
        current.push(node)
        current = node.children
      }
    }
  }

  return root
}

export default function FileExplorer({ projectId, refreshTrigger }: Props) {
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const fetchFiles = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files`)
    const json = await res.json()
    if (json.data) setFiles(json.data)
  }, [projectId])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles, refreshTrigger])

  async function openFile(path: string) {
    setSelectedFile(path)
    setLoading(true)
    const res = await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`)
    const json = await res.json()
    setFileContent(json.data ?? "")
    setLoading(false)
  }

  const tree = buildTree(files)

  return (
    <div className="w-64 border-r flex flex-col bg-card shrink-0">
      <div className="h-10 border-b flex items-center justify-between px-3">
        <span className="text-xs text-muted-foreground font-medium">Files</span>
        <button onClick={fetchFiles} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">No files yet</p>
        </div>
      ) : selectedFile ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-1 px-3 py-2 border-b">
            <button
              onClick={() => setSelectedFile(null)}
              className="text-xs text-primary hover:underline"
            >
              ← Back
            </button>
            <span className="text-xs text-muted-foreground truncate">{selectedFile}</span>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : (
              <pre className="text-xs text-foreground whitespace-pre-wrap break-all font-mono">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-1">
          {tree.map((node) => (
            <TreeNodeRow key={node.path} node={node} depth={0} onFileClick={openFile} />
          ))}
        </div>
      )}
    </div>
  )
}

function TreeNodeRow({
  node,
  depth,
  onFileClick,
}: {
  node: TreeNode
  depth: number
  onFileClick: (path: string) => void
}) {
  const [open, setOpen] = useState(depth === 0)

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 w-full px-2 py-0.5 hover:bg-muted text-xs text-foreground"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {open ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          )}
          {open ? (
            <FolderOpen className="w-3 h-3 text-yellow-500 shrink-0" />
          ) : (
            <Folder className="w-3 h-3 text-yellow-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {open &&
          node.children.map((child) => (
            <TreeNodeRow key={child.path} node={child} depth={depth + 1} onFileClick={onFileClick} />
          ))}
      </div>
    )
  }

  return (
    <button
      onClick={() => onFileClick(node.path)}
      className={cn(
        "flex items-center gap-1 w-full px-2 py-0.5 hover:bg-muted text-xs text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
    >
      <FileCode className="w-3 h-3 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}
