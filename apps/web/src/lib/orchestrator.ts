const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL ?? "http://localhost:3003"
const ORCHESTRATOR_SECRET = process.env.ORCHESTRATOR_SECRET ?? "orchestrator-internal-secret"

const headers = {
  "Content-Type": "application/json",
  "x-orchestrator-secret": ORCHESTRATOR_SECRET,
}

export async function startAgentTask(projectId: string, prompt: string, conversationId: string, model = "gemini-2.0-flash") {
  const res = await fetch(`${ORCHESTRATOR_URL}/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({ projectId, prompt, conversationId, model }),
  })
  if (!res.ok) {
    let body = ""
    try { body = await res.text() } catch {}
    throw new Error(`Orchestrator ${res.status}: ${body || "no body"}`)
  }
  return res.json() as Promise<{ taskId: string }>
}

export async function getTask(taskId: string) {
  const res = await fetch(`${ORCHESTRATOR_URL}/task/${taskId}`, { headers })
  if (!res.ok) throw new Error(`Task not found: ${taskId}`)
  return res.json() as Promise<{ data: { id: string; status: string; steps: unknown[]; error?: string } }>
}

export async function getProjectFiles(projectId: string) {
  const res = await fetch(`${ORCHESTRATOR_URL}/files/${projectId}`, { headers })
  if (!res.ok) return { data: [] as string[] }
  return res.json() as Promise<{ data: string[] }>
}

export async function getFileContent(projectId: string, filePath: string) {
  const res = await fetch(
    `${ORCHESTRATOR_URL}/files/${projectId}/content?path=${encodeURIComponent(filePath)}`,
    { headers }
  )
  if (!res.ok) return { data: "" }
  return res.json() as Promise<{ data: string }>
}
