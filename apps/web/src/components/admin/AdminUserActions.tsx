"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Coins, Loader2, CreditCard, ChevronDown, Check } from "lucide-react"
import { createPortal } from "react-dom"

interface Plan {
  id: string
  name: string
  slug: string
}

interface Props {
  userId: string
  currentRole: string
  currentPlanId: string | null
  currentPlanSlug: string | null
  plans: Plan[]
}

export default function AdminUserActions({ userId, currentRole, currentPlanId, currentPlanSlug, plans }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [planOpen, setPlanOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!planOpen) return
    function handleClick(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setPlanOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [planOpen])

  function openDropdown() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX })
    }
    setPlanOpen(!planOpen)
  }

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

  const dropdown = planOpen ? createPortal(
    <div
      style={{ position: "absolute", top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
      className="bg-white dark:bg-zinc-900 border rounded-lg shadow-xl w-40 py-1"
    >
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => switchPlan(plan.slug === "free" ? "free" : plan.id)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted text-left"
        >
          {plan.name}
          {(plan.slug === "free" ? !currentPlanId : currentPlanId === plan.id) && (
            <Check className="w-3 h-3 text-primary" />
          )}
        </button>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div className="flex items-center gap-1">
      {/* Plan switcher */}
      <button
        ref={btnRef}
        onClick={openDropdown}
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
      {dropdown}

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
