"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import type { SubscriptionPlan } from "@mojadoo/database"

interface Props {
  plans: SubscriptionPlan[]
}

export default function AdminPlanEditor({ plans }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, { credits: number; priceMonthly: number; isActive: boolean }>>(
    Object.fromEntries(plans.map((p) => [p.id, { credits: p.credits, priceMonthly: p.priceMonthly, isActive: p.isActive }]))
  )

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
    <div className="bg-card border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            {["Plan", "Price (₱ centavos)", "Credits", "Active", ""].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {plans.map((plan) => (
            <tr key={plan.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.slug}</p>
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  value={edits[plan.id].priceMonthly}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], priceMonthly: Number(e.target.value) } }))}
                  className="w-28 rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  value={edits[plan.id].credits}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], credits: Number(e.target.value) } }))}
                  className="w-24 rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={edits[plan.id].isActive}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], isActive: e.target.checked } }))}
                  className="w-4 h-4"
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => savePlan(plan.id)}
                  disabled={saving === plan.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === plan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
