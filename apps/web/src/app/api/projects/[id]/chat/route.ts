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

const FREE_DAILY_LIMIT = 5
const FREE_MONTHLY_LIMIT = 25

// Estimate credit cost based on prompt complexity
function estimateCost(prompt: string): number {
  const len = prompt.trim().length
  if (len < 50) return 0.5   // small tweak e.g. "change button color to red"
  if (len < 150) return 1    // simple feature
  if (len < 400) return 2    // medium feature
  return 3                   // complex feature
}

function isNewDay(date: Date): boolean {
  const now = new Date()
  return (
    now.getUTCFullYear() !== date.getUTCFullYear() ||
    now.getUTCMonth() !== date.getUTCMonth() ||
    now.getUTCDate() !== date.getUTCDate()
  )
}

function isNewMonth(date: Date): boolean {
  const now = new Date()
  return (
    now.getUTCFullYear() !== date.getUTCFullYear() ||
    now.getUTCMonth() !== date.getUTCMonth()
  )
}

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

  // Get active subscription to determine plan
  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { plan: true },
  })

  const isFree = !subscription

  // Get or create wallet
  let wallet = await prisma.creditWallet.findUnique({ where: { userId: session.user.id } })
  if (!wallet) {
    wallet = await prisma.creditWallet.create({
      data: {
        userId: session.user.id,
        balance: FREE_DAILY_LIMIT,
        lifetimeCredits: FREE_DAILY_LIMIT,
        dailyCredits: FREE_DAILY_LIMIT,
        dailyCreditsDate: new Date(),
        monthlyCreditsUsed: 0,
      },
    })
  }

  // Reset daily credits at 00:00 UTC for free users
  if (isFree && isNewDay(wallet.dailyCreditsDate)) {
    const resetMonthly = isNewMonth(wallet.dailyCreditsDate)
    wallet = await prisma.creditWallet.update({
      where: { userId: session.user.id },
      data: {
        balance: FREE_DAILY_LIMIT,
        dailyCredits: FREE_DAILY_LIMIT,
        dailyCreditsDate: new Date(),
        monthlyCreditsUsed: resetMonthly ? 0 : wallet.monthlyCreditsUsed,
      },
    })
  }

  const cost = estimateCost(parsed.data.content)

  // Free plan limits
  if (isFree) {
    if (wallet.monthlyCreditsUsed >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json(
        { error: "Monthly limit of 25 credits reached. Upgrade your plan to continue." },
        { status: 402 }
      )
    }
    if (wallet.balance < cost) {
      return NextResponse.json(
        { error: `Not enough daily credits. You need ${cost} credits but have ${wallet.balance}. Resets at 00:00 UTC.` },
        { status: 402 }
      )
    }
  } else {
    // Paid plan — use balance
    if (wallet.balance < cost) {
      return NextResponse.json(
        { error: "Insufficient credits. Please top up or upgrade your plan." },
        { status: 402 }
      )
    }
  }

  // Save user message
  const userMessage = await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: parsed.data.content },
  })

  // Deduct credits
  const costInt = Math.ceil(cost)
  await prisma.$transaction([
    prisma.creditWallet.update({
      where: { userId: session.user.id },
      data: {
        balance: { decrement: costInt },
        usedCredits: { increment: costInt },
        monthlyCreditsUsed: { increment: costInt },
      },
    }),
    prisma.creditTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEBIT",
        amount: costInt,
        balanceAfter: wallet.balance - costInt,
        description: `AI build (${cost} credits)`,
      },
    }),
  ])

  // Start orchestrator task
  let taskId: string | null = null
  try {
    const result = await startAgentTask(project.id, parsed.data.content, conversation.id, project.aiModel ?? "gpt-4o")
    taskId = result.taskId
  } catch {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: "Orchestrator is not running. Start it with: cd apps/orchestrator && pnpm dev",
      },
    })
    return NextResponse.json({ data: { userMessage, taskId: null } })
  }

  return NextResponse.json({ data: { userMessage, taskId, conversationId: conversation.id, creditCost: cost } })
}
