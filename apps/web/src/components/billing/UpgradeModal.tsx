"use client"

import { useRouter } from "next/navigation"
import { Coins, X, Zap } from "lucide-react"

interface Props {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: Props) {
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border rounded-xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Coins className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Out of credits</h2>
              <p className="text-sm text-muted-foreground">Upgrade to keep building</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { name: "Starter", price: "₱299/mo", credits: "500 credits" },
            { name: "Pro", price: "₱799/mo", credits: "2,000 credits", popular: true },
            { name: "Business", price: "₱1,999/mo", credits: "10,000 credits" },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                plan.popular ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {plan.popular && <Zap className="w-3.5 h-3.5 text-primary" />}
                <span className="text-sm font-medium">{plan.name}</span>
                <span className="text-xs text-muted-foreground">{plan.credits}</span>
              </div>
              <span className="text-sm font-semibold">{plan.price}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-md border text-sm hover:bg-muted"
          >
            Maybe later
          </button>
          <button
            onClick={() => { onClose(); router.push("/pricing") }}
            className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            View plans
          </button>
        </div>
      </div>
    </div>
  )
}
