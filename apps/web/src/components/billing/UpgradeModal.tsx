"use client"

import { useRouter } from "next/navigation"
import { Coins, X, Zap, TrendingUp, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  priceMonthly: number
  credits: number
}

interface Props {
  onClose: () => void
  errorMessage?: string
  currentPlan?: string
}

const TOPUPS = [
  { label: "100 credits", price: "₱99", credits: 100 },
  { label: "300 credits", price: "₱249", credits: 300 },
  { label: "500 credits", price: "₱399", credits: 500 },
]

export default function UpgradeModal({ onClose, errorMessage, currentPlan }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<"upgrade" | "topup">("upgrade")
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const isFree = !currentPlan || currentPlan === "free"

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((r) => r.json())
      .then((json) => {
        const paid = (json.data as Plan[]).filter((p) => p.priceMonthly > 0)
        setPlans(paid)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Out of credits</h2>
              <p className="text-sm text-muted-foreground">
                {errorMessage ?? "You've used all your credits for this period."}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mx-6">
          <button
            onClick={() => setTab("upgrade")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "upgrade" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Upgrade Plan
          </button>
          {!isFree && (
            <button
              onClick={() => setTab("topup")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === "topup" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              Buy Credits
            </button>
          )}
        </div>

        <div className="p-6">
          {tab === "upgrade" ? (
            <div className="space-y-2.5">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                plans.map((plan) => {
                  const isPopular = plan.slug === "pro"
                  return (
                    <div
                      key={plan.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                        isPopular ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isPopular && <Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{plan.name}</span>
                            {isPopular && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Popular</span>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {plan.credits >= 999999 ? "Unlimited credits" : `${plan.credits.toLocaleString()} credits/mo`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold shrink-0 ml-2">
                        ₱{(plan.priceMonthly / 100).toLocaleString()}/mo
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-sm text-muted-foreground mb-4">
                Buy extra credits that never expire and stack on top of your plan.
              </p>
              {TOPUPS.map((t) => (
                <div
                  key={t.credits}
                  className="flex items-center justify-between p-3.5 rounded-xl border hover:bg-muted/50 cursor-pointer"
                  onClick={() => { onClose(); router.push(`/billing?topup=${t.credits}`) }}
                >
                  <div>
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-muted-foreground">One-time purchase · never expires</p>
                  </div>
                  <span className="text-sm font-bold">{t.price}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border text-sm hover:bg-muted transition-colors"
            >
              Maybe later
            </button>
            <button
              onClick={() => { onClose(); router.push("/pricing") }}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {tab === "upgrade" ? "View all plans" : "Go to billing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
