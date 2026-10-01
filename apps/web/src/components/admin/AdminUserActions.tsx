"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Coins, Loader2, CreditCard, ChevronDown, Check } from "lucide-react"

interface Plan {
  id: string
  name: string
  slug: string
}

interface Props {
  userId: string
  currentRole: string
  currentPlanId: string | null
  plans: Plan[]
}

export default function AdminUserActions({ userId, currentRole, currentPlanId, plans }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [planOpen, setPlanOpen] = useState(false)
  const router = useRouter()

  async function patch(body: object) {
    await fetch("/api/mojadoo/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...body }),
    })
  }

  async function toggleRole() {
    setLoading("role")
    await patch({ role: currentRole === "ADMIN" ? "USER" : "ADMIN" })
    router.refresh()
    setLoading(null)
  }

  async function grantCredits() {
    const amount = prompt("Credits to add:")
    if (!amount || isNaN(Number(amount))) return
    setLoading("credits")
    await patch({ addCredits: Number(amount) })
    router.refresh()
    setLoading(null)
  }

  async function switchPlan(planId: string) {
    setPlanOpen(false)
    setLoading("plan")
    await patch({ planId })
    router.refresh()
    setLoading(null)
  }

  const currentPlan = plans.find((p) => p.id === currentPlanId)

  return (
    <div className="flex items-center gap-1">
      {/* Plan switcher */}
      <div className="relative">
        <button
          onClick={() => setPlanOpen(!planOpen)}
          disabled={loading === "plan"}
          title="Switch plan"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 border"
        >
          {loading === "plan" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CreditCard className="w-3 h-3" />
          )}
          <span>{currentPlan?.name ?? "Free"}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {planOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setPlanOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-card border rounded-lg shadow-lg w-36 py-1">
              {/* Free option */}
              <button
                onClick={() => switchPlan("free")}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-muted text-left"
              >
                Free
                {!currentPlanId && <Check className="w-3 h-3 text-primary" />}
              </button>
              {plans.filter(p => p.slug !== "free").map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => switchPlan(plan.id)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs hover:bg-muted text-left"
                >
                  {plan.name}
                  {currentPlanId === plan.id && <Check className="w-3 h-3 text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Role toggle */}
      <button
        onClick={toggleRole}
        disabled={loading === "role"}
        title={currentRole === "ADMIN" ? "Remove admin" : "Make admin"}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {loading === "role" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
      </button>

      {/* Grant credits */}
      <button
        onClick={grantCredits}
        disabled={loading === "credits"}
        title="Grant credits"
        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {loading === "credits" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
