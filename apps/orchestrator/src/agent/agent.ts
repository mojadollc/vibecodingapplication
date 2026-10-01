import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { tools } from "./tool-definitions.js"
import { SYSTEM_PROMPT, SYSTEM_PROMPT_SHORT, BASE_SCAFFOLD } from "./prompts.js"
import { createFile, readFile, listFiles, deleteFile, ensureWorkspace } from "../tools/file.js"
import { runCommand } from "../tools/shell.js"
import { gitCommit, gitInit } from "../tools/git.js"
import { prisma } from "@mojadoo/database"

const MAX_ITERATIONS = 40
const MAX_RETRIES = 3

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
  free: "gemini-3.5-flash",
  starter: "gemini-3.5-flash",
  builder: "gpt-4o-mini",
  pro: "gpt-4o",
  agency: "gpt-4o",
}

function getProvider(model: string): string {
  if (model.startsWith("gpt-")) return "openai"
  if (model.startsWith("gemini-")) return "gemini"
  if (model.startsWith("claude-")) return "anthropic"
  if (model.startsWith("openai/gpt-oss") || ["llama3-70b-8192", "llama3-8b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"].includes(model)) return "groq"
  return "openai"
}

// Scaffold file paths — agent doesn't need to read these, we return cached content
const SCAFFOLD_PATHS = new Set(Object.keys(BASE_SCAFFOLD))

// Fallback chain: if primary provider hits rate limit, try these
const FALLBACK_MODELS: Record<string, string[]> = {
  gemini: ["openai/gpt-oss-20b", "gemini-3.5-flash-lite"],
  groq:   ["gemini-3.5-flash", "gemini-3.5-flash-lite"],
  openai: ["gemini-3.5-flash"],
}

function getRetryAfter(err: any): number {
  // OpenAI SDK surfaces status directly on the error object
  const headers = err?.headers ?? err?.response?.headers ?? {}
  const val = parseFloat(headers["retry-after"] ?? headers["x-ratelimit-reset-requests"] ?? "")
  return isNaN(val) ? 10 : val
}

function getStatus(err: any): number {
  return err?.status ?? err?.response?.status ?? 0
}

function getErrDetail(err: any): string {
  const status = getStatus(err)
  const body = err?.error ?? {}
  return [
    `status=${status}`,
    body?.code   ? `code=${body.code}`     : "",
    body?.message ? `msg=${body.message}`  : (err?.message ?? ""),
  ].filter(Boolean).join(" | ")
}

async function callWithRetry(
  fn: () => Promise<any>,
  provider: string,
  model: string
): Promise<any> {
  let lastErr: any
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastErr = err
      const status = getStatus(err)
      if (status === 429 || status === 503) {
        const retryAfter = getRetryAfter(err)
        // exponential backoff: 10s, 20s, 40s
        const wait = retryAfter * Math.pow(2, attempt - 1) * 1000
        console.warn(`[${provider}/${model}] ${status} attempt=${attempt}/${MAX_RETRIES} ${getErrDetail(err)} — waiting ${wait / 1000}s`)
        await new Promise((r) => setTimeout(r, wait))
      } else {
        throw err
      }
    }
  }
  throw new Error(`[${provider}/${model}] failed after ${MAX_RETRIES} retries: ${getErrDetail(lastErr)}`)
}

async function callWithFallback(
  messages: ChatCompletionMessageParam[],
  provider: string,
  model: string,
  client: OpenAI
): Promise<{ response: any; usedModel: string }> {
  try {
    const response = await callWithRetry(
      () => client.chat.completions.create({ model, messages, tools, tool_choice: "auto" }),
      provider,
      model
    )
    return { response, usedModel: model }
  } catch (primaryErr: any) {
    const fallbacks = FALLBACK_MODELS[provider] ?? []
    for (const fallbackModel of fallbacks) {
      const fallbackProvider = getProvider(fallbackModel)
      const fallbackClient = buildClient(fallbackProvider)
      console.warn(`[${provider}/${model}] down, trying fallback ${fallbackProvider}/${fallbackModel}`)
      try {
        const response = await callWithRetry(
          () => fallbackClient.chat.completions.create({ model: fallbackModel, messages, tools, tool_choice: "auto" }),
          fallbackProvider,
          fallbackModel
        )
        return { response, usedModel: fallbackModel }
      } catch {
        // try next fallback
      }
    }
    throw primaryErr
  }
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
  model = "gemini-3.5-flash"
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

  // Use short prompt for ALL providers to reduce token usage
  const isGroq = primaryProvider === "groq"
  const systemPrompt = SYSTEM_PROMPT_SHORT
  const MAX_PREV_MESSAGES = isGroq ? 2 : 4

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...previousMessages.slice(-MAX_PREV_MESSAGES).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: isNewProject
      ? `${prompt}\n\n[Scaffold already created: package.json, tailwind.config.js, postcss.config.js, next.config.js, tsconfig.json, src/app/globals.css, src/app/layout.tsx, src/lib/utils.ts. Dependencies installed. Start writing feature files immediately.]`
      : prompt
    },
  ]

  let iterations = 0
  let finalSummary = ""

  while (iterations < MAX_ITERATIONS) {
    iterations++

    await prisma.aiTask.update({ where: { id: taskId }, data: { status: "RUNNING" } })
    onStep({ type: "thinking", message: iterations === 1 ? "Analyzing your request..." : `Thinking... (step ${iterations})` })

    let response
    try {
      const result = await callWithFallback(messages, primaryProvider, model, primaryClient)
      response = result.response
      if (result.usedModel !== model) {
        onStep({ type: "thinking", message: `Switched to fallback model: ${result.usedModel}` })
      }
    } catch (err: any) {
      const errMsg = err?.message ?? String(err)
      const label = `[${primaryProvider}/${model}] AI error: ${errMsg}`
      onStep({ type: "error", message: label })
      await prisma.aiTask.update({
        where: { id: taskId },
        data: { status: "FAILED", error: label },
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

          await createFile(projectId, args.path, args.content)
          await prisma.projectFile.upsert({
            where: { projectId_path: { projectId, path: args.path } },
            update: { content: args.content },
            create: { projectId, path: args.path, content: args.content },
          })
          result = `Created ${args.path}`
          onStep({ type: "tool_result", message: `✓ ${shortPath}`, tool: fnName })

        } else if (fnName === "read_file") {
          onStep({ type: "tool_call", message: `Reading ${args.path.split("/").slice(-1)[0]}`, tool: fnName })
          // Return cached scaffold content to avoid wasting tokens re-reading known files
          const cached = BASE_SCAFFOLD[args.path as keyof typeof BASE_SCAFFOLD]
          result = cached ?? await readFile(projectId, args.path)
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
