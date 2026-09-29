"use client"

import { useState, useEffect } from "react"
import { Cpu, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiModel {
  modelId: string
  label: string
  provider: string
  isFast: boolean
}

interface Props {
  projectId: string
  currentModel: string
}

export default function ModelSelector({ projectId, currentModel }: Props) {
  const [models, setModels] = useState<AiModel[]>([])
  const [selected, setSelected] = useState(currentModel)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/mojadoo/models")
      .then((r) => r.json())
      .then((d) => setModels(d.data ?? []))
  }, [])

  const current = models.find((m) => m.modelId === selected) ?? models[0]

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
          <div className="absolute top-full mt-1 right-0 z-20 bg-card border rounded-lg shadow-lg w-56 py-1">
            {models.map((model) => (
              <button
                key={model.modelId}
                onClick={() => selectModel(model.modelId)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-muted text-left"
              >
                <div>
                  <p className="font-medium">{model.label}</p>
                  <p className="text-muted-foreground">{model.provider}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {model.isFast && (
                    <span className="text-xs bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">Fast</span>
                  )}
                  {selected === model.modelId && <Check className="w-3 h-3 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
