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

// Model tiers — which plans can use which models
const FREE_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "llama3-70b-8192", "mixtral-8x7b-32768", "gemma2-9b-it"]
const STARTER_MODELS = [...FREE_MODELS, "gpt-4o-mini"]
const PRO_MODELS = [...STARTER_MODELS, "gpt-4o", "claude-3-5-sonnet-20241022"]
const AGENCY_MODELS = PRO_MODELS

// Default model per plan — matches PLAN_DEFAULT_MODELS in agent
const DEFAULT_MODEL: Record<string, string> = {
  free:    "gemini-2.5-flash",
  starter: "gemini-2.5-flash",
  builder: "gpt-4o-mini",
  pro:     "gpt-4o",
  agency:  "gpt-4o",
}

function getAllowedModels(planSlug: string): string[] {
  switch (planSlug) {
    case "agency": return AGENCY_MODELS
    case "pro": return PRO_MODELS
    case "builder": return STARTER_MODELS
    case "starter": return STARTER_MODELS
    default: return FREE_MODELS
  }
}

function estimateCost(prompt: string): number {
  const len = prompt.trim().length
  if (len < 50) return 0.5
  if (len < 150) return 1
  if (len < 400) return 2
  return 3
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

  // Get active subscription
  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { plan: true },
  })

  const planSlug = subscription?.plan.slug ?? "free"
  const isFree = planSlug === "free"
  const allowedModels = getAllowedModels(planSlug)

  // Read dynamic limits from SystemConfig
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ["free_daily_credits", "free_monthly_credits", "credit_cost_small", "credit_cost_medium", "credit_cost_large"] } },
  })
  const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))
  const freeDailyLimit = Number(cfg.free_daily_credits ?? FREE_DAILY_LIMIT)
  const freeMonthlyLimit = Number(cfg.free_monthly_credits ?? FREE_MONTHLY_LIMIT)

  // Determine which model to use — enforce plan restrictions
  let modelToUse = project.aiModel ?? DEFAULT_MODEL[planSlug]
  if (!allowedModels.includes(modelToUse)) {
    // Downgrade to plan default if selected model not allowed
    modelToUse = DEFAULT_MODEL[planSlug]
    await prisma.project.update({ where: { id: project.id }, data: { aiModel: modelToUse } })
  }

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
        balance: freeDailyLimit,
        dailyCredits: freeDailyLimit,
        dailyCreditsDate: new Date(),
        monthlyCreditsUsed: resetMonthly ? 0 : wallet.monthlyCreditsUsed,
      },
    })
  }

  const cost = estimateCost(parsed.data.content)

  // Free plan limits
  if (isFree) {
    if (wallet.monthlyCreditsUsed >= freeMonthlyLimit) {
      return NextResponse.json(
        { error: `Monthly limit of ${freeMonthlyLimit} credits reached. Upgrade your plan to continue.` },
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
        description: `AI build via ${modelToUse} (${cost} credits)`,
      },
    }),
  ])

  // Start orchestrator task with enforced model
  let taskId: string | null = null
  try {
    const result = await startAgentTask(project.id, parsed.data.content, conversation.id, modelToUse)
    taskId = result.taskId
  } catch (err: any) {
    // Refund credits since task never started
    await prisma.creditWallet.update({
      where: { userId: session.user.id },
      data: {
        balance: { increment: costInt },
        usedCredits: { decrement: costInt },
        monthlyCreditsUsed: { decrement: costInt },
      },
    })
    return NextResponse.json(
      { error: `Could not reach AI agent: ${err.message}. Please try again.` },
      { status: 503 }
    )
  }

  if (!taskId) {
    return NextResponse.json(
      { error: "AI agent did not return a task ID. Please try again." },
      { status: 503 }
    )
  }

  return NextResponse.json({ data: { userMessage, taskId, conversationId: conversation.id, creditCost: cost, model: modelToUse } })
}
