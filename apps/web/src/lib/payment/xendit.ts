import crypto from "crypto"
import type { PaymentAdapter, CheckoutParams, CheckoutResult, WebhookVerifyResult } from "./types"

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY ?? ""
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN ?? ""
const XENDIT_API = "https://api.xendit.co"

async function xenditRequest(path: string, body: object) {
  const res = await fetch(`${XENDIT_API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Xendit API error ${res.status}: ${err}`)
  }
  return res.json()
}

export const xenditAdapter: PaymentAdapter = {
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const invoice = await xenditRequest("/v2/invoices", {
      external_id: params.paymentId,
      amount: Math.round(params.amount / 100), // Xendit uses whole PHP
      description: params.description,
      currency: "PHP",
      success_redirect_url: params.successUrl,
      failure_redirect_url: params.cancelUrl,
      customer: { given_names: params.userId },
      items: [{ name: params.planName, quantity: 1, price: Math.round(params.amount / 100) }],
    })

    return {
      checkoutUrl: invoice.invoice_url,
      providerPaymentId: invoice.id,
    }
  },

  async verifyWebhook(payload: string, headers: Record<string, string>): Promise<WebhookVerifyResult> {
    // Xendit webhook verification via x-callback-token header
    const token = headers["x-callback-token"]
    if (!XENDIT_WEBHOOK_TOKEN || token !== XENDIT_WEBHOOK_TOKEN) {
      return { valid: false, providerPaymentId: "", status: "FAILED", metadata: {} }
    }

    const data = JSON.parse(payload)
    const statusMap: Record<string, "PAID" | "FAILED" | "EXPIRED"> = {
      PAID: "PAID",
      SETTLED: "PAID",
      EXPIRED: "EXPIRED",
      FAILED: "FAILED",
    }

    return {
      valid: true,
      providerPaymentId: data.id,
      status: statusMap[data.status] ?? "FAILED",
      metadata: { externalId: data.external_id, amount: String(data.amount) },
    }
  },
}
