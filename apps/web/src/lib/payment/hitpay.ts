import crypto from "crypto"
import type { PaymentAdapter, CheckoutParams, CheckoutResult, WebhookVerifyResult } from "./types"

const HITPAY_API_KEY = process.env.HITPAY_API_KEY ?? ""
const HITPAY_SALT = process.env.HITPAY_SALT ?? ""
const HITPAY_API = process.env.HITPAY_ENV === "production"
  ? "https://api.hit-pay.com/v1"
  : "https://api.sandbox.hit-pay.com/v1"

async function hitpayRequest(path: string, body: Record<string, string>) {
  const form = new URLSearchParams(body)
  const res = await fetch(`${HITPAY_API}${path}`, {
    method: "POST",
    headers: {
      "X-BUSINESS-API-KEY": HITPAY_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HitPay API error ${res.status}: ${err}`)
  }
  return res.json()
}

export const hitpayAdapter: PaymentAdapter = {
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const payment = await hitpayRequest("/payment-requests", {
      amount: (params.amount / 100).toFixed(2),
      currency: "PHP",
      purpose: params.description,
      redirect_url: params.successUrl,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/hitpay`,
      reference_number: params.paymentId,
    })

    return {
      checkoutUrl: payment.url,
      providerPaymentId: payment.id,
    }
  },

  async verifyWebhook(payload: string, headers: Record<string, string>): Promise<WebhookVerifyResult> {
    // HitPay uses HMAC-SHA256 signature
    const data = new URLSearchParams(payload)
    const hmac = data.get("hmac") ?? ""
    data.delete("hmac")

    // Sort keys and build signature string
    const sortedKeys = Array.from(data.keys()).sort()
    const sigString = sortedKeys.map((k) => `${k}${data.get(k)}`).join("")
    const expected = crypto.createHmac("sha256", HITPAY_SALT).update(sigString).digest("hex")

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
      return { valid: false, providerPaymentId: "", status: "FAILED", metadata: {} }
    }

    const statusMap: Record<string, "PAID" | "FAILED" | "EXPIRED"> = {
      completed: "PAID",
      failed: "FAILED",
      pending: "FAILED",
    }

    return {
      valid: true,
      providerPaymentId: data.get("payment_id") ?? "",
      status: statusMap[data.get("status") ?? ""] ?? "FAILED",
      metadata: {
        referenceNumber: data.get("reference_number") ?? "",
        amount: data.get("amount") ?? "",
      },
    }
  },
}
