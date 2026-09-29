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

// Plan default models
export const PLAN_DEFAULT_MODELS: Record<string, string> = {
  free: "gemini-2.5-flash",
  starter: "gemini-2.5-flash",
  builder: "gpt-4o-mini",
  pro: "gpt-4o",
  agency: "gpt-4o",
}

const FILE_WRITING_MODEL: Record<string, string> = {
  "gpt-4o": "gemini-2.5-flash",
  "claude-3-5-sonnet-20241022": "gemini-2.5-flash",
  "gpt-4o-mini": "gpt-4o-mini",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.5-pro": "gemini-2.5-flash",
  "openai/gpt-oss-20b": "openai/gpt-oss-20b",
  "openai/gpt-oss-120b": "gemini-2.5-flash",
}

function getProvider(model: string): string {
  if (model.startsWith("gpt-")) return "openai"
  if (model.startsWith("gemini-")) return "gemini"
  if (model.startsWith("claude-")) return "anthropic"
  if (model.startsWith("openai/gpt-oss") || ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"].includes(model)) return "groq"
  return "openai"
}

function buildClient(provider: string): OpenAI {
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
  onStep({ type: "thinking", message: "Setting up project structure..." })
  for (const [filePath, content] of Object.entries(BASE_SCAFFOLD)) {
    await createFile(projectId, filePath, content)
    await prisma.projectFile.upsert({
      where: { projectId_path: { projectId, path: filePath } },
      update: { content },
      create: { projectId, path: filePath, content },
    })
    onStep({ type: "tool_result", message: `\u2713 ${filePath}`, tool: "create_file" })
  }
  onStep({ type: "tool_call", message: "Installing dependencies (this may take a minute)...", tool: "run_command" })
  await runCommand(projectId, "npm install --legacy-peer-deps")
  onStep({ type: "tool_result", message: "\u2713 Dependencies installed", tool: "run_command" })
}

export async function runAgent(
  projectId: string,
  taskId: string,
  prompt: string,
  previousMessages: { role: string; content: string }[],
  onStep: StepCallback,
  model = "gemini-2.5-flash"
): Promise<string> {
  await ensureWorkspace(projectId)

  const existingFiles = await listFiles(projectId)
  const isNewProject = existingFiles.length === 0
  if (isNewProject) {
    await gitInit(projectId)
    await scaffoldBase(projectId, onStep)
  }

  // Primary client for planning/thinking
  const primaryProvider = getProvider(model)
  const primaryClient = buildClient(primaryProvider)

  // Secondary client for file writing (cheaper model to save costs)
  const fileWriteModel = FILE_WRITING_MODEL[model] ?? model
  const fileWriteProvider = getProvider(fileWriteModel)
  const fileWriteClient = fileWriteModel !== model ? buildClient(fileWriteProvider) : primaryClient

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
  let fileWriteCount = 0

  while (iterations < MAX_ITERATIONS) {
    iterations++

    await prisma.aiTask.update({ where: { id: taskId }, data: { status: "RUNNING" } })
    onStep({ type: "thinking", message: iterations === 1 ? "Analyzing your request..." : `Thinking... (step ${iterations})` })

    let response
    try {
      response = await primaryClient.chat.completions.create({
        model,
        messages,
        tools,
        tool_choice: "auto",
      })
    } catch (err: any) {
      const errMsg = err?.message ?? String(err)
      onStep({ type: "error", message: `AI API error: ${errMsg}` })
      await prisma.aiTask.update({
        where: { id: taskId },
        data: { status: "FAILED", error: `AI API error: ${errMsg}` },
      })
      return `Failed: ${errMsg}`
    }

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

      let result = ""

      try {
        if (fnName === "create_file") {
          const shortPath = args.path.split("/").slice(-2).join("/")
          onStep({ type: "tool_call", message: `Writing ${shortPath}`, tool: fnName })

          let fileContent = args.content
          if (fileWriteModel !== model && fileWriteCount < 20) {
            fileWriteCount++
            try {
              const writeResponse = await fileWriteClient.chat.completions.create({
                model: fileWriteModel,
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  {
                    role: "user",
                    content: `Write the complete content for file: ${args.path}\n\nContext: ${prompt}\n\nRequirements: Follow the design system exactly. Return ONLY the file content, no explanation.`,
                  },
                ],
              })
              const generated = writeResponse.choices[0]?.message?.content
              if (generated && generated.length > 50) {
                fileContent = generated.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "")
              }
            } catch {
              // fallback to original content from primary model
            }
          }

          await createFile(projectId, args.path, fileContent)
          await prisma.projectFile.upsert({
            where: { projectId_path: { projectId, path: args.path } },
            update: { content: fileContent },
            create: { projectId, path: args.path, content: fileContent },
          })
          result = `Created ${args.path}`
          onStep({ type: "tool_result", message: `✓ ${shortPath}`, tool: fnName })

        } else if (fnName === "read_file") {
          onStep({ type: "tool_call", message: `Reading ${args.path.split("/").slice(-1)[0]}`, tool: fnName })
          result = await readFile(projectId, args.path)
          onStep({ type: "tool_result", message: `Read ${args.path.split("/").slice(-1)[0]}`, tool: fnName })

        } else if (fnName === "list_files") {
          onStep({ type: "tool_call", message: "Scanning project files...", tool: fnName })
          const files = await listFiles(projectId, args.subDir)
          result = files.length > 0 ? files.join("\n") : "No files yet"
          onStep({ type: "tool_result", message: `Found ${files.length} files`, tool: fnName })

        } else if (fnName === "run_command") {
          const shortCmd = args.command.length > 50 ? args.command.slice(0, 50) + "..." : args.command
          onStep({ type: "tool_call", message: `Running: ${shortCmd}`, tool: fnName })
          const cmdResult = await runCommand(projectId, args.command)
          result = cmdResult.stdout || cmdResult.stderr || "Command completed"
          if (cmdResult.exitCode !== 0) {
            result = `ERROR (exit ${cmdResult.exitCode}):\n${cmdResult.stderr}\n${cmdResult.stdout}`
            onStep({ type: "error", message: `Command failed: ${shortCmd}` })
          } else {
            onStep({ type: "tool_result", message: `✓ ${shortCmd}`, tool: fnName })
          }

        } else if (fnName === "delete_file") {
          onStep({ type: "tool_call", message: `Deleting ${args.path.split("/").slice(-1)[0]}`, tool: fnName })
          await deleteFile(projectId, args.path)
          await prisma.projectFile.deleteMany({ where: { projectId, path: args.path } })
          result = `Deleted ${args.path}`
          onStep({ type: "tool_result", message: `Deleted ${args.path.split("/").slice(-1)[0]}`, tool: fnName })

        } else if (fnName === "task_complete") {
          finalSummary = args.summary
          onStep({ type: "thinking", message: "Committing changes..." })
          await gitCommit(projectId, `feat: ${prompt.slice(0, 72)}`)
          await prisma.project.update({ where: { id: projectId }, data: { status: "RUNNING" } })
          await prisma.aiTask.update({ where: { id: taskId }, data: { status: "DONE" } })
          onStep({ type: "done", message: finalSummary })
          return finalSummary
        }

      } catch (err: any) {
        result = `Tool error: ${err.message}`
        onStep({ type: "error", message: `Error: ${err.message}` })
      }

      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result })
    }
  }

  await prisma.aiTask.update({
    where: { id: taskId },
    data: { status: "FAILED", error: "Max iterations reached" },
  })

  return finalSummary || "Task completed"
}
