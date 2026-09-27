import fs from "fs-extra"
import path from "path"

export function getWorkspacePath(projectId: string): string {
  const base = path.resolve(process.env.WORKSPACES_PATH ?? "../../workspaces")
  return path.join(base, projectId)
}

export async function ensureWorkspace(projectId: string): Promise<string> {
  const dir = getWorkspacePath(projectId)
  await fs.ensureDir(dir)
  return dir
}

export async function createFile(projectId: string, filePath: string, content: string): Promise<void> {
  const workspace = getWorkspacePath(projectId)
  const fullPath = path.join(workspace, filePath)
  await fs.ensureDir(path.dirname(fullPath))
  await fs.writeFile(fullPath, content, "utf-8")
}

export async function readFile(projectId: string, filePath: string): Promise<string> {
  const workspace = getWorkspacePath(projectId)
  const fullPath = path.join(workspace, filePath)
  return fs.readFile(fullPath, "utf-8")
}

export async function updateFile(projectId: string, filePath: string, content: string): Promise<void> {
  await createFile(projectId, filePath, content)
}

export async function deleteFile(projectId: string, filePath: string): Promise<void> {
  const workspace = getWorkspacePath(projectId)
  const fullPath = path.join(workspace, filePath)
  await fs.remove(fullPath)
}

export async function listFiles(projectId: string, subDir = ""): Promise<string[]> {
  const workspace = getWorkspacePath(projectId)
  const targetDir = subDir ? path.join(workspace, subDir) : workspace
  const exists = await fs.pathExists(targetDir)
  if (!exists) return []

  const results: string[] = []

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(workspace, fullPath).replace(/\\/g, "/")
      if (entry.isDirectory()) {
        if (!["node_modules", ".next", ".git", "dist"].includes(entry.name)) {
          await walk(fullPath)
        }
      } else {
        results.push(relativePath)
      }
    }
  }

  await walk(targetDir)
  return results
}
