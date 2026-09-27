import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { tools } from "./tool-definitions.js"
import { createFile, readFile, listFiles, deleteFile, ensureWorkspace } from "../tools/file.js"
import { runCommand } from "../tools/shell.js"
import { gitCommit, gitInit } from "../tools/git.js"
import { prisma } from "@mojadoo/database"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_ITERATIONS = 30

export interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "error" | "done"
  message: string
  tool?: string
  args?: Record<string, unknown>
  result?: string
}

export type StepCallback = (step: AgentStep) => void

const SYSTEM_PROMPT = `You are an expert full-stack developer AI. You build complete, working Next.js applications.

When given a task:
1. Plan what files need to be created or modified
2. Create all necessary files using the tools provided
3. Install any required packages with run_command
4. Run the build to verify it compiles (npm run build)
5. If there are errors, read the relevant files, fix them, and rebuild
6. Once the build succeeds, call task_complete with a summary

Rules:
- Always create a complete package.json first if the project is new
- Use Next.js 14 App Router with TypeScript and Tailwind CSS
- Use shadcn/ui components where appropriate
- Keep code clean and production-ready
- Fix ALL build errors before calling task_complete
- Never call task_complete if the build failed`

export async function runAgent(
  projectId: string,
  taskId: string,
  prompt: string,
  previousMessages: { role: string; content: string }[],
  onStep: StepCallback,
  model = "gpt-4o"
): Promise<string> {
  await ensureWorkspace(projectId)

  // Check if this is a new project (no files yet)
  const existingFiles = await listFiles(projectId)
  const isNewProject = existingFiles.length === 0

  if (isNewProject) {
    await gitInit(projectId)
  }

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

    await prisma.aiTask.update({
      where: { id: taskId },
      data: { status: "RUNNING" },
    })

    onStep({ type: "thinking", message: "Thinking..." })

    const response = await openai.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: "auto",
    })

    const choice = response.choices[0]
    const assistantMessage = choice.message

    messages.push(assistantMessage)

    // No tool calls — AI gave a plain text response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      finalSummary = assistantMessage.content ?? "Done"
      break
    }

    // Execute each tool call
    for (const toolCall of assistantMessage.tool_calls) {
      const fnName = toolCall.function.name
      const args = JSON.parse(toolCall.function.arguments) as Record<string, string>

      onStep({ type: "tool_call", message: `Calling ${fnName}`, tool: fnName, args })

      let result = ""

      try {
        if (fnName === "create_file") {
          await createFile(projectId, args.path, args.content)
          // Sync to DB
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
          // Commit the final state
          await gitCommit(projectId, `feat: ${prompt.slice(0, 72)}`)
          await prisma.project.update({
            where: { id: projectId },
            data: { status: "RUNNING" },
          })
          await prisma.aiTask.update({
            where: { id: taskId },
            data: { status: "DONE" },
          })
          onStep({ type: "done", message: finalSummary })
          return finalSummary
        }

      } catch (err: any) {
        result = `Tool error: ${err.message}`
        onStep({ type: "error", message: result })
      }

      onStep({ type: "tool_result", message: result.slice(0, 200), tool: fnName, result })

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      })
    }
  }

  // Exceeded max iterations
  await prisma.aiTask.update({
    where: { id: taskId },
    data: { status: "FAILED", error: "Max iterations reached" },
  })

  return finalSummary || "Task completed"
}
