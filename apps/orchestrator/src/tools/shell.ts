import { execa } from "execa"
import { getWorkspacePath } from "./file.js"

export interface ShellResult {
  stdout: string
  stderr: string
  exitCode: number
}

const TIMEOUT_MS = 300_000 // 5 minutes max per command

export async function runCommand(projectId: string, command: string): Promise<ShellResult> {
  const cwd = getWorkspacePath(projectId)

  try {
    const result = await execa("bash", ["-c", command], {
      cwd,
      timeout: TIMEOUT_MS,
      reject: false,
      all: true,
      env: {
        ...process.env,
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.23.3/bin",
      },
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
