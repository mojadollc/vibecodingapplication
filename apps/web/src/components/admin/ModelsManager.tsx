"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import type { AiModelConfig } from "@mojadoo/database"

const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: "bg-green-500/10 text-green-600",
  Google: "bg-blue-500/10 text-blue-600",
  Anthropic: "bg-orange-500/10 text-orange-600",
  Groq: "bg-purple-500/10 text-purple-600",
}

const PROVIDER_KEY_HINT: Record<string, string> = {
  OpenAI: "OPENAI_API_KEY",
  Google: "GEMINI_API_KEY",
  Anthropic: "ANTHROPIC_API_KEY",
  Groq: "GROQ_API_KEY",
}

export default function ModelsManager({ models }: { models: AiModelConfig[] }) {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(models.map((m) => [m.modelId, m.enabled]))
  )
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function toggle(modelId: string, enabled: boolean) {
    setLoading(modelId)
    await fetch("/api/mojadoo/models", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, enabled }),
    })
    setStates((s) => ({ ...s, [modelId]: enabled }))
    setLoading(null)
    router.refresh()
  }

  const providers = [...new Set(models.map((m) => m.provider))]

  return (
    <div className="space-y-8">
      {providers.map((provider) => (
        <div key={provider}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROVIDER_COLORS[provider] ?? "bg-muted text-muted-foreground"}`}>
              {provider}
            </span>
            <span className="text-xs text-muted-foreground">API Key: <code>{PROVIDER_KEY_HINT[provider]}</code></span>
          </div>
          <div className="bg-card border rounded-xl divide-y">
            {models.filter((m) => m.provider === provider).map((m) => (
              <div key={m.modelId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.modelId}</p>
                </div>
                <div className="flex items-center gap-3">
                  {m.isFast && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full">Fast</span>
                  )}
                  {loading === m.modelId ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <button
                      onClick={() => toggle(m.modelId, !states[m.modelId])}
                      className={`relative w-10 h-5 rounded-full transition-colors ${states[m.modelId] ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${states[m.modelId] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
