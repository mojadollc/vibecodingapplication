"use client"

import { useState } from "react"
import { Cpu, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export const AI_MODELS = [
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI", fast: false },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", fast: true },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", provider: "Anthropic", fast: false },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google", fast: false },
] as const

interface Props {
  projectId: string
  currentModel: string
}

export default function ModelSelector({ projectId, currentModel }: Props) {
  const [selected, setSelected] = useState(currentModel)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const current = AI_MODELS.find((m) => m.id === selected) ?? AI_MODELS[0]

  async function selectModel(modelId: string) {
    setSaving(true)
    setSelected(modelId)
    setOpen(false)
    await fetch(`/api/projects/${projectId}/model`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: modelId }),
    })
    setSaving(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs hover:bg-muted transition-colors"
      >
        <Cpu className="w-3 h-3 text-muted-foreground" />
        <span className={saving ? "opacity-50" : ""}>{current.label}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-20 bg-card border rounded-lg shadow-lg w-52 py-1">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => selectModel(model.id)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted text-left"
              >
                <div>
                  <p className="font-medium">{model.label}</p>
                  <p className="text-muted-foreground">{model.provider}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {model.fast && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">Fast</span>
                  )}
                  {selected === model.id && <Check className="w-3 h-3 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
