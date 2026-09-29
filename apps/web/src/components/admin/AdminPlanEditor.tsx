"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, ChevronDown } from "lucide-react"
import type { SubscriptionPlan } from "@mojadoo/database"

const AVAILABLE_MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Free)" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { id: "llama3-70b-8192", label: "Llama 3 70B (Free)" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Free)" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
]

interface PlanEdit {
  priceMonthly: number
  credits: number
  maxProjects: number
  isActive: boolean
  defaultModel: string
  description: string
}

export default function AdminPlanEditor({ plans }: { plans: SubscriptionPlan[] }) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, PlanEdit>>(
    Object.fromEntries(plans.map((p) => [p.id, {
      priceMonthly: p.priceMonthly,
      credits: p.credits,
      maxProjects: p.maxProjects,
      isActive: p.isActive,
      defaultModel: (p as any).defaultModel ?? "gemini-2.0-flash",
      description: p.description ?? "",
    }]))
  )

  function update(planId: string, field: keyof PlanEdit, value: any) {
    setEdits((prev) => ({ ...prev, [planId]: { ...prev[planId], [field]: value } }))
  }

  async function savePlan(planId: string) {
    setSaving(planId)
    await fetch("/api/mojadoo/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, ...edits[planId] }),
    })
    router.refresh()
    setSaving(null)
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const e = edits[plan.id]
        const priceInPHP = (e.priceMonthly / 100).toFixed(0)
        return (
          <div key={plan.id} className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.slug}</p>
                </div>
                <button
                  onClick={() => update(plan.id, "isActive", !e.isActive)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${e.isActive ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${e.isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className={`text-xs px-2 py-0.5 rounded-full ${e.isActive ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                  {e.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={() => savePlan(plan.id)}
                disabled={saving === plan.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {saving === plan.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Price (₱/mo)</label>
                <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                  <span className="px-3 py-2 text-sm text-muted-foreground border-r bg-muted">₱</span>
                  <input
                    type="number"
                    value={priceInPHP}
                    onChange={(e) => update(plan.id, "priceMonthly", Math.round(Number(e.target.value) * 100))}
                    className="flex-1 px-3 py-2 text-sm bg-background outline-none"
                    min={0}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{e.priceMonthly} centavos</p>
              </div>

              {/* Credits */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Credits/mo</label>
                <input
                  type="number"
                  value={e.credits}
                  onChange={(ev) => update(plan.id, "credits", Number(ev.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                  min={0}
                />
              </div>

              {/* Max Projects */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Max Projects</label>
                <input
                  type="number"
                  value={e.maxProjects}
                  onChange={(ev) => update(plan.id, "maxProjects", Number(ev.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                  min={1}
                />
                {e.maxProjects >= 999 && <p className="text-xs text-muted-foreground">Unlimited</p>}
              </div>

              {/* Default Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Default AI Model</label>
                <div className="relative">
                  <select
                    value={e.defaultModel}
                    onChange={(ev) => update(plan.id, "defaultModel", ev.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <input
                type="text"
                value={e.description}
                onChange={(ev) => update(plan.id, "description", ev.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                placeholder="Plan description shown to users..."
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
