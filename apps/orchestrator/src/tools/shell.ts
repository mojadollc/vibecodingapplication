import { execa } from "execa"
import { getWorkspacePath } from "./file.js"

export interface ShellResult {
  stdout: string
  stderr: string
  exitCode: number
}

const TIMEOUT_MS = 120_000 // 2 minutes max per command

export async function runCommand(projectId: string, command: string): Promise<ShellResult> {
  const cwd = getWorkspacePath(projectId)

  try {
    const result = await execa("cmd", ["/c", command], {
      cwd,
      timeout: TIMEOUT_MS,
      reject: false,
      all: true,
    })

    return {
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.exitCode ?? 0,
    }
  } catch (err: any) {
    return {
      stdout: "",
      stderr: err.message ?? String(err),
      exitCode: 1,
    }
  }
}

export async function installPackages(projectId: string, packages: string[]): Promise<ShellResult> {
  return runCommand(projectId, `npm install ${packages.join(" ")}`)
}

export async function runBuild(projectId: string): Promise<ShellResult> {
  return runCommand(projectId, "npm run build")
}

export async function runDev(projectId: string, port: number): Promise<ShellResult> {
  return runCommand(projectId, `npm run dev -- --port ${port}`)
}
