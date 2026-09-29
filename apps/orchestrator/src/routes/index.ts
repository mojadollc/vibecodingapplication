import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "@mojadoo/database"
import { runAgent } from "../agent/agent.js"
import { listFiles, readFile } from "../tools/file.js"

const runSchema = z.object({
  projectId: z.string(),
  prompt: z.string().min(1),
  conversationId: z.string(),
  model: z.string().default("gpt-4o"),
})

export async function registerRoutes(app: FastifyInstance) {
  // Health check
  app.get("/health", async () => ({ ok: true }))

  // Run AI agent for a project
  app.post("/run", async (req, reply) => {
    const secret = req.headers["x-orchestrator-secret"]
    if (secret !== process.env.ORCHESTRATOR_SECRET) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    const parsed = runSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { projectId, prompt, conversationId, model } = parsed.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.status(404).send({ error: "Project not found" })

    // Get conversation history
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 20,
    })

    // Create AI task record
    const task = await prisma.aiTask.create({
      data: { projectId, prompt, status: "PENDING", steps: [] },
    })

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "BUILDING" },
    })

    const steps: object[] = []

    // Run agent (non-blocking — reply with taskId immediately, agent runs async)
    setImmediate(async () => {
      try {
        await runAgent(
          projectId,
          task.id,
          prompt,
          messages.map((m: { role: string; content: string }) => ({ role: m.role.toLowerCase(), content: m.content })),
          (step) => {
            steps.push(step)
            prisma.aiTask.update({
              where: { id: task.id },
              data: { steps },
            }).catch(() => {})
          },
          model
        )
      } catch (err: any) {
        await prisma.aiTask.update({
          where: { id: task.id },
          data: { status: "FAILED", error: err.message },
        })
        await prisma.project.update({
          where: { id: projectId },
          data: { status: "ERROR" },
        })
      }
    })

    return reply.send({ taskId: task.id })
  })

  // Poll task status + steps
  app.get<{ Params: { taskId: string } }>("/task/:taskId", async (req, reply) => {
    const task = await prisma.aiTask.findUnique({ where: { id: req.params.taskId } })
    if (!task) return reply.status(404).send({ error: "Task not found" })
    return reply.send({ data: task })
  })

  // List project files
  app.get<{ Params: { projectId: string } }>("/files/:projectId", async (req, reply) => {
    const files = await listFiles(req.params.projectId)
    return reply.send({ data: files })
  })

  // Read a specific file
  app.get<{ Params: { projectId: string }; Querystring: { path: string } }>(
    "/files/:projectId/content",
    async (req, reply) => {
      try {
        const content = await readFile(req.params.projectId, req.query.path)
        return reply.send({ data: content })
      } catch {
        return reply.status(404).send({ error: "File not found" })
      }
    }
  )
}
