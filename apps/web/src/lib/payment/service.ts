import { prisma } from "@mojadoo/database"
import { xenditAdapter } from "./xendit"
import { hitpayAdapter } from "./hitpay"
import type { Provider, CheckoutParams } from "./types"

function getAdapter(provider: Provider) {
  return provider === "XENDIT" ? xenditAdapter : hitpayAdapter
}

export async function createCheckout(
  userId: string,
  planId: string,
  provider: Provider,
  appUrl: string
) {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) throw new Error("Plan not found")

  // Create pending payment record first so we have an ID for the provider
  const payment = await prisma.payment.create({
    data: {
      userId,
      provider,
      amount: plan.priceMonthly,
      currency: "PHP",
      description: `Mojadoo ${plan.name} — monthly subscription`,
      status: "PENDING",
      metadata: { planId },
    },
  })

  const adapter = getAdapter(provider)
  const result = await adapter.createCheckout({
    userId,
    planId,
    planName: plan.name,
    amount: plan.priceMonthly,
    description: payment.description!,
    successUrl: `${appUrl}/billing?success=1&paymentId=${payment.id}`,
    cancelUrl: `${appUrl}/pricing?cancelled=1`,
    paymentId: payment.id,
  })

  // Store checkout URL and provider payment ID
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      checkoutUrl: result.checkoutUrl,
      providerPaymentId: result.providerPaymentId,
    },
  })

  return { checkoutUrl: result.checkoutUrl, paymentId: payment.id }
}

export async function handleSuccessfulPayment(
  provider: Provider,
  providerPaymentId: string,
  internalPaymentId: string
) {
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { id: internalPaymentId },
        { providerPaymentId },
      ],
    },
  })
  if (!payment || payment.status === "PAID") return // already processed

  const planId = (payment.metadata as Record<string, string>).planId
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) return

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await prisma.$transaction(async (tx) => {
    // Mark payment paid
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", providerPaymentId },
    })

    // Cancel any existing active subscription
    await tx.subscription.updateMany({
      where: { userId: payment.userId, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    })

    // Create new subscription
    const subscription = await tx.subscription.create({
      data: {
        userId: payment.userId,
        planId,
        provider,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    })

    // Link payment to subscription
    await tx.payment.update({
      where: { id: payment.id },
      data: { subscriptionId: subscription.id },
    })

    // Top up credit wallet
    const wallet = await tx.creditWallet.upsert({
      where: { userId: payment.userId },
      update: {
        balance: { increment: plan.credits },
        lifetimeCredits: { increment: plan.credits },
      },
      create: {
        userId: payment.userId,
        balance: plan.credits,
        lifetimeCredits: plan.credits,
      },
    })

    await tx.creditTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: plan.credits,
        balanceAfter: wallet.balance + plan.credits,
        description: `${plan.name} subscription`,
        reference: payment.id,
      },
    })
  })
}
