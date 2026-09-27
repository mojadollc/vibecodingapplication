"use client"

import { useState } from "react"
import { Check, Loader2, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SubscriptionPlan } from "@mojadoo/database"

interface Props {
  plans: SubscriptionPlan[]
  currentPlanId?: string
}

const HIGHLIGHTS: Record<string, string[]> = {
  free:     ["50 AI credits", "3 projects", "Community support"],
  starter:  ["500 AI credits/mo", "10 projects", "Email support", "GitHub sync"],
  pro:      ["2,000 AI credits/mo", "Unlimited projects", "Priority support", "Custom domains"],
  business: ["10,000 AI credits/mo", "Unlimited projects", "Dedicated support", "Team access"],
}

export default function PricingCards({ plans, currentPlanId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [provider, setProvider] = useState<"XENDIT" | "HITPAY">("XENDIT")

  async function handleSubscribe(planId: string) {
    setLoading(planId)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, provider }),
      })
      const json = await res.json()
      if (json.data?.checkoutUrl) {
        window.location.href = json.data.checkoutUrl
      } else {
        alert(json.error ?? "Checkout failed")
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Provider selector */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">Pay with:</span>
        <div className="flex rounded-lg border overflow-hidden">
          {(["XENDIT", "HITPAY"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium transition-colors",
                provider === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {p === "XENDIT" ? "Xendit" : "HitPay"}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const isPro = plan.slug === "pro"
          const features = HIGHLIGHTS[plan.slug] ?? []

          return (
            <div
              key={plan.id}
              className={cn(
                "relative bg-card border rounded-xl p-6 flex flex-col",
                isPro && "border-primary shadow-md",
                isCurrent && "ring-2 ring-primary"
              )}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3" /> Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                {plan.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                )}
              </div>

              <div className="mb-6">
                {plan.priceMonthly === 0 ? (
                  <span className="text-3xl font-bold">Free</span>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">
                      ₱{(plan.priceMonthly / 100).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm mb-1">/mo</span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-2 rounded-md bg-muted text-muted-foreground text-sm font-medium">
                  Current plan
                </div>
              ) : plan.priceMonthly === 0 ? (
                <div className="w-full text-center py-2 rounded-md border text-sm text-muted-foreground">
                  Free forever
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={cn(
                    "w-full py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50",
                    isPro
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border hover:bg-muted"
                  )}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `Subscribe via ${provider === "XENDIT" ? "Xendit" : "HitPay"}`
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Payments processed securely by {provider === "XENDIT" ? "Xendit" : "HitPay"}.
        Cancel anytime from your billing page.
      </p>
    </div>
  )
}
