import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"
import { xenditAdapter } from "@/lib/payment/xendit"
import { handleSuccessfulPayment } from "@/lib/payment/service"

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const hdrs: Record<string, string> = {}
  req.headers.forEach((v, k) => { hdrs[k] = v })

  // Log raw webhook
  await prisma.paymentWebhook.create({
    data: { provider: "XENDIT", eventType: "invoice", payload: JSON.parse(payload) },
  })

  const result = await xenditAdapter.verifyWebhook(payload, hdrs)

  if (!result.valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  await prisma.paymentWebhook.updateMany({
    where: { provider: "XENDIT", processed: false },
    data: { processed: true },
  })

  if (result.status === "PAID") {
    const internalId = result.metadata.externalId ?? ""
    await handleSuccessfulPayment("XENDIT", result.providerPaymentId, internalId)
  }

  return NextResponse.json({ received: true })
}
