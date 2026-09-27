"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Coins, Loader2 } from "lucide-react"

interface Props {
  userId: string
  currentRole: string
}

export default function AdminUserActions({ userId, currentRole }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function patch(body: object) {
    await fetch("/api/admin/users", {
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

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleRole}
        disabled={loading === "role"}
        title={currentRole === "ADMIN" ? "Remove admin" : "Make admin"}
        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {loading === "role" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
      </button>
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
