import { runCommand } from "./shell.js"

export async function gitInit(projectId: string): Promise<void> {
  await runCommand(projectId, "git init")
  await runCommand(projectId, 'git config user.email "builder@mojadoo.com"')
  await runCommand(projectId, 'git config user.name "Mojadoo Builder"')
}

export async function gitAdd(projectId: string): Promise<void> {
  await runCommand(projectId, "git add -A")
}

export async function gitCommit(projectId: string, message: string): Promise<void> {
  await gitAdd(projectId)
  await runCommand(projectId, `git commit -m "${message.replace(/"/g, "'")}"`)
}

export async function gitStatus(projectId: string): Promise<string> {
  const result = await runCommand(projectId, "git status --short")
  return result.stdout
}
