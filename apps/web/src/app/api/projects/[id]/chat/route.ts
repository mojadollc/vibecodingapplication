import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { startAgentTask } from "@/lib/orchestrator"
import { z } from "zod"

const schema = z.object({
  content: z.string().min(1),
  conversationId: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Get or create conversation
  let conversation = parsed.data.conversationId
    ? await prisma.conversation.findFirst({
        where: { id: parsed.data.conversationId, projectId: project.id },
      })
    : null

  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { projectId: project.id } })
  }

  // Check credits
  const wallet = await prisma.creditWallet.findUnique({ where: { userId: session.user.id } })
  if (!wallet || wallet.balance < 1) {
    return NextResponse.json(
      { error: "Insufficient credits. Please upgrade your plan." },
      { status: 402 }
    )
  }

  // Save user message
  const userMessage = await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: parsed.data.content },
  })

  // Deduct 1 credit
  await prisma.$transaction([
    prisma.creditWallet.update({
      where: { userId: session.user.id },
      data: { balance: { decrement: 1 }, usedCredits: { increment: 1 } },
    }),
    prisma.creditTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEBIT",
        amount: 1,
        balanceAfter: wallet.balance - 1,
        description: "AI chat message",
      },
    }),
  ])

  // Start orchestrator task (non-blocking)
  let taskId: string | null = null
  try {
    const result = await startAgentTask(project.id, parsed.data.content, conversation.id, project.aiModel ?? "gpt-4o")
    taskId = result.taskId
  } catch {
    // Orchestrator not running — save placeholder message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: "Orchestrator is not running. Start it with: cd apps/orchestrator && pnpm dev",
      },
    })
    return NextResponse.json({ data: { userMessage, taskId: null } })
  }

  return NextResponse.json({ data: { userMessage, taskId, conversationId: conversation.id } })
}
