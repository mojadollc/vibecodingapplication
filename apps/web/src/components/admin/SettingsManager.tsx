"use client"

import { useState } from "react"
import { Save, RefreshCw } from "lucide-react"

interface Props {
  settings: Record<string, string>
}

const GROUPS = [
  {
    label: "Site",
    keys: [
      { key: "site_name", label: "Site Name", type: "text" },
      { key: "site_tagline", label: "Tagline", type: "text" },
      { key: "maintenance_mode", label: "Maintenance Mode", type: "toggle", hint: "Blocks all user access when enabled" },
      { key: "allow_signups", label: "Allow New Signups", type: "toggle", hint: "Disable to stop new registrations" },
    ],
  },
  {
    label: "Free Plan Limits",
    keys: [
      { key: "free_daily_credits", label: "Daily Credits (Free)", type: "number", hint: "Credits given to free users per day" },
      { key: "free_monthly_credits", label: "Monthly Cap (Free)", type: "number", hint: "Max credits free users can use per month" },
      { key: "default_free_model", label: "Default Model (Free)", type: "text", hint: "e.g. gemini-2.0-flash" },
    ],
  },
  {
    label: "Credit Costs",
    keys: [
      { key: "credit_cost_small", label: "Small Prompt Cost", type: "number", hint: "Prompts under 50 chars (e.g. color change)" },
      { key: "credit_cost_medium", label: "Medium Prompt Cost", type: "number", hint: "Prompts 50-400 chars" },
      { key: "credit_cost_large", label: "Large Prompt Cost", type: "number", hint: "Prompts over 400 chars (complex features)" },
    ],
  },
  {
    label: "AI Agent",
    keys: [
      { key: "max_iterations", label: "Max Agent Iterations", type: "number", hint: "How many steps AI can take per build (default 40)" },
    ],
  },
]

export default function SettingsManager({ settings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(settings)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  function update(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function saveAll() {
    setSaving(true)
    setMsg("")
    const res = await fetch("/api/mojadoo/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    })
    const d = await res.json()
    setMsg(d.message ?? (res.ok ? "Saved!" : "Error saving"))
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <div key={group.label}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group.label}</h2>
          <div className="bg-card border rounded-xl divide-y">
            {group.keys.map((field) => (
              <div key={field.key} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{field.label}</p>
                  {field.hint && <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>}
                </div>
                <div className="shrink-0">
                  {field.type === "toggle" ? (
                    <button
                      onClick={() => update(field.key, values[field.key] === "true" ? "false" : "true")}
                      className={`relative w-10 h-5 rounded-full transition-colors ${values[field.key] === "true" ? "bg-primary" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${values[field.key] === "true" ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={values[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      className="w-48 border rounded-lg px-3 py-1.5 text-sm bg-background outline-none focus:ring-2 focus:ring-ring text-right"
                      min={field.type === "number" ? 0 : undefined}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={saveAll}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save All Settings"}
        </button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </div>
    </div>
  )
}
