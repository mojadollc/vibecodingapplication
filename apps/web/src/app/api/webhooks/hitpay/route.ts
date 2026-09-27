import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"
import { hitpayAdapter } from "@/lib/payment/hitpay"
import { handleSuccessfulPayment } from "@/lib/payment/service"

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const hdrs: Record<string, string> = {}
  req.headers.forEach((v, k) => { hdrs[k] = v })

  // Parse form body to get event type
  const data = new URLSearchParams(payload)

  // Log raw webhook
  const webhookData: Record<string, string> = {}
  data.forEach((v, k) => { webhookData[k] = v })

  await prisma.paymentWebhook.create({
    data: { provider: "HITPAY", eventType: data.get("status") ?? "unknown", payload: webhookData },
  })

  const result = await hitpayAdapter.verifyWebhook(payload, hdrs)

  if (!result.valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  await prisma.paymentWebhook.updateMany({
    where: { provider: "HITPAY", processed: false },
    data: { processed: true },
  })

  if (result.status === "PAID") {
    const internalId = result.metadata.referenceNumber ?? ""
    await handleSuccessfulPayment("HITPAY", result.providerPaymentId, internalId)
  }

  return NextResponse.json({ received: true })
}
