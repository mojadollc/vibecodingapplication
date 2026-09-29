import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { tools } from "./tool-definitions.js"
import { SYSTEM_PROMPT, BASE_SCAFFOLD } from "./prompts.js"
import { createFile, readFile, listFiles, deleteFile, ensureWorkspace } from "../tools/file.js"
import { runCommand } from "../tools/shell.js"
import { gitCommit, gitInit } from "../tools/git.js"
import { prisma } from "@mojadoo/database"

const MAX_ITERATIONS = 40

export interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "error" | "done"
  message: string
  tool?: string
  args?: Record<string, unknown>
  result?: string
}

export type StepCallback = (step: AgentStep) => void

function getProvider(model: string): string {
  if (model.startsWith("gpt-")) return "openai"
  if (model.startsWith("gemini-")) return "gemini"
  if (model.startsWith("claude-")) return "anthropic"
  if (["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"].includes(model)) return "groq"
  return "openai"
}

function buildClient(provider: string) {
  switch (provider) {
    case "gemini":
      return new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      })
    case "groq":
      return new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      })
    case "anthropic":
      return new OpenAI({
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseURL: "https://api.anthropic.com/v1/",
        defaultHeaders: { "anthropic-version": "2023-06-01" },
      })
    default:
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
}

async function scaffoldBase(projectId: string, onStep: StepCallback) {
  onStep({ type: "thinking", message: "Scaffolding beautiful base project..." })

  for (const [filePath, content] of Object.entries(BASE_SCAFFOLD)) {
    await createFile(projectId, filePath, content)
    await prisma.projectFile.upsert({
      where: { projectId_path: { projectId, path: filePath } },
      update: { content },
      create: { projectId, path: filePath, content },
    })
  }

  onStep({ type: "tool_call", message: "Installing dependencies...", tool: "run_command" })
  await runCommand(projectId, "npm install --legacy-peer-deps")
  onStep({ type: "tool_result", message: "Base scaffold ready", tool: "run_command" })
}

export async function runAgent(
  projectId: string,
  taskId: string,
  prompt: string,
  previousMessages: { role: string; content: string }[],
  onStep: StepCallback,
  model = "gpt-4o"
): Promise<string> {
  await ensureWorkspace(projectId)

  const existingFiles = await listFiles(projectId)
  const isNewProject = existingFiles.length === 0

  if (isNewProject) {
    await gitInit(projectId)
    await scaffoldBase(projectId, onStep)
  }

  const provider = getProvider(model)
  const client = buildClient(provider)

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...previousMessages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: prompt },
  ]

  let iterations = 0
  let finalSummary = ""

  while (iterations < MAX_ITERATIONS) {
    iterations++

    await prisma.aiTask.update({ where: { id: taskId }, data: { status: "RUNNING" } })
    onStep({ type: "thinking", message: "Thinking..." })

    const response = await client.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: "auto",
    })

    const choice = response.choices[0]
    const assistantMessage = choice.message
    messages.push(assistantMessage)

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      finalSummary = assistantMessage.content ?? "Done"
      break
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const fnName = toolCall.function.name
      const args = JSON.parse(toolCall.function.arguments) as Record<string, string>

      onStep({ type: "tool_call", message: `Calling ${fnName}`, tool: fnName, args })

      let result = ""

      try {
        if (fnName === "create_file") {
          await createFile(projectId, args.path, args.content)
          await prisma.projectFile.upsert({
            where: { projectId_path: { projectId, path: args.path } },
            update: { content: args.content },
            create: { projectId, path: args.path, content: args.content },
          })
          result = `Created ${args.path}`

        } else if (fnName === "read_file") {
          result = await readFile(projectId, args.path)

        } else if (fnName === "list_files") {
          const files = await listFiles(projectId, args.subDir)
          result = files.length > 0 ? files.join("\n") : "No files yet"

        } else if (fnName === "run_command") {
          onStep({ type: "tool_call", message: `Running: ${args.command}`, tool: "run_command" })
          const cmdResult = await runCommand(projectId, args.command)
          result = cmdResult.stdout || cmdResult.stderr || "Command completed"
          if (cmdResult.exitCode !== 0) {
            result = `ERROR (exit ${cmdResult.exitCode}):\n${cmdResult.stderr}\n${cmdResult.stdout}`
          }

        } else if (fnName === "delete_file") {
          await deleteFile(projectId, args.path)
          await prisma.projectFile.deleteMany({ where: { projectId, path: args.path } })
          result = `Deleted ${args.path}`

        } else if (fnName === "task_complete") {
          finalSummary = args.summary
          await gitCommit(projectId, `feat: ${prompt.slice(0, 72)}`)
          await prisma.project.update({ where: { id: projectId }, data: { status: "RUNNING" } })
          await prisma.aiTask.update({ where: { id: taskId }, data: { status: "DONE" } })
          onStep({ type: "done", message: finalSummary })
          return finalSummary
        }

      } catch (err: any) {
        result = `Tool error: ${err.message}`
        onStep({ type: "error", message: result })
      }

      onStep({ type: "tool_result", message: result.slice(0, 200), tool: fnName, result })
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result })
    }
  }

  await prisma.aiTask.update({
    where: { id: taskId },
    data: { status: "FAILED", error: "Max iterations reached" },
  })

  return finalSummary || "Task completed"
}
