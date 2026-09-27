export type Provider = "XENDIT" | "HITPAY"

export interface CheckoutParams {
  userId: string
  planId: string
  planName: string
  amount: number        // PHP centavos
  description: string
  successUrl: string
  cancelUrl: string
  paymentId: string     // our internal payment record id
}

export interface CheckoutResult {
  checkoutUrl: string
  providerPaymentId: string
}

export interface WebhookVerifyResult {
  valid: boolean
  providerPaymentId: string
  status: "PAID" | "FAILED" | "EXPIRED"
  metadata: Record<string, string>
}

export interface PaymentAdapter {
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>
  verifyWebhook(payload: string, headers: Record<string, string>): Promise<WebhookVerifyResult>
}
