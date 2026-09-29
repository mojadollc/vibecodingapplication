"use client"

import { useState, useEffect } from "react"
import { Cpu, ChevronDown, Check, Lock } from "lucide-react"

interface AiModel {
  modelId: string
  label: string
  provider: string
  isFast: boolean
}

interface Props {
  projectId: string
  currentModel: string
  planSlug?: string
}

const FREE_MODELS = ["gemini-3.8-flash", "gemini-3.8-flash-lite", "gemini-3.8-pro", "gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.5-flash-lite", "openai/gpt-oss-20b"]
const STARTER_MODELS = [...FREE_MODELS, "gpt-4o-mini", "openai/gpt-oss-120b"]
const PRO_MODELS = [...STARTER_MODELS, "gpt-4o", "claude-3-5-sonnet-20241022"]

function getAllowedModels(planSlug: string): string[] {
  switch (planSlug) {
    case "agency":
    case "pro": return PRO_MODELS
    case "builder":
    case "starter": return STARTER_MODELS
    default: return FREE_MODELS
  }
}

function getRequiredPlan(modelId: string): string | null {
  if (["gpt-4o", "claude-3-5-sonnet-20241022"].includes(modelId)) return "Pro"
  if (["gpt-4o-mini", "openai/gpt-oss-120b"].includes(modelId)) return "Starter"
  return null
}

export default function ModelSelector({ projectId, currentModel, planSlug = "free" }: Props) {
  const [models, setModels] = useState<AiModel[]>([])
  const [selected, setSelected] = useState(currentModel)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const allowedModels = getAllowedModels(planSlug)

  useEffect(() => {
    fetch("/api/mojadoo/models")
      .then((r) => r.json())
      .then((d) => setModels(d.data ?? []))
  }, [])

  const current = models.find((m) => m.modelId === selected) ?? models[0]

  async function selectModel(modelId: string) {
    if (!allowedModels.includes(modelId)) return
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

  if (!models.length) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs hover:bg-muted transition-colors"
      >
        <Cpu className="w-3 h-3 text-muted-foreground" />
        <span className={saving ? "opacity-50" : ""}>{current?.label ?? "Select model"}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-20 bg-card border rounded-lg shadow-lg w-64 py-1">
            {models.map((model) => {
              const isLocked = !allowedModels.includes(model.modelId)
              const requiredPlan = getRequiredPlan(model.modelId)
              return (
                <button
                  key={model.modelId}
                  onClick={() => selectModel(model.modelId)}
                  disabled={isLocked}
                  className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left transition-colors ${
                    isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                  }`}
                >
                  <div>
                    <p className="font-medium">{model.label}</p>
                    <p className="text-muted-foreground">{model.provider}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {model.isFast && !isLocked && (
                      <span className="text-xs bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">Fast</span>
                    )}
                    {isLocked && requiredPlan && (
                      <span className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" />{requiredPlan}
                      </span>
                    )}
                    {selected === model.modelId && !isLocked && <Check className="w-3 h-3 text-primary" />}
                  </div>
                </button>
              )
            })}
            {planSlug === "free" && (
              <div className="px-3 py-2 border-t mt-1">
                <a href="/pricing" className="text-xs text-primary hover:underline">
                  Upgrade to unlock GPT-4o & Claude →
                </a>
              </div>
            )}
            {planSlug === "starter" && (
              <div className="px-3 py-2 border-t mt-1">
                <a href="/pricing" className="text-xs text-primary hover:underline">
                  Upgrade to unlock GPT-4o & Claude →
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
