"use client"

import { useState, useEffect } from "react"
import { Save, Eye, EyeOff, RefreshCw } from "lucide-react"

const FIELDS = [
  { key: "OPENAI_API_KEY", label: "OpenAI API Key", group: "AI" },
  { key: "GITHUB_CLIENT_ID", label: "GitHub Client ID", group: "GitHub OAuth" },
  { key: "GITHUB_CLIENT_SECRET", label: "GitHub Client Secret", group: "GitHub OAuth" },
  { key: "XENDIT_SECRET_KEY", label: "Xendit Secret Key", group: "Payments" },
  { key: "XENDIT_WEBHOOK_TOKEN", label: "Xendit Webhook Token", group: "Payments" },
  { key: "HITPAY_API_KEY", label: "HitPay API Key", group: "Payments" },
  { key: "HITPAY_SALT", label: "HitPay Salt", group: "Payments" },
  { key: "HITPAY_ENV", label: "HitPay Environment (sandbox/production)", group: "Payments" },
  { key: "COOLIFY_URL", label: "Coolify URL", group: "Coolify" },
  { key: "COOLIFY_TOKEN", label: "Coolify Token", group: "Coolify" },
  { key: "COOLIFY_SERVER_UUID", label: "Coolify Server UUID", group: "Coolify" },
  { key: "BETTER_AUTH_SECRET", label: "Auth Secret", group: "Auth" },
]

export default function CredentialsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    fetch("/api/mojadoo/credentials")
      .then((r) => r.json())
      .then((d) => { setValues(d.data ?? {}); setLoading(false) })
  }, [])

  async function save() {
    setSaving(true)
    setMsg("")
    const res = await fetch("/api/mojadoo/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    })
    const d = await res.json()
    setMsg(d.message ?? (res.ok ? "Saved & restarted!" : "Error saving"))
    setSaving(false)
  }

  const groups = [...new Set(FIELDS.map((f) => f.group))]

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Credentials</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Changes are saved to <code>.env.local</code> and the app restarts automatically.
      </p>

      {groups.map((group) => (
        <div key={group} className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{group}</h2>
          <div className="bg-card border rounded-xl divide-y">
            {FIELDS.filter((f) => f.group === group).map((f) => (
              <div key={f.key} className="flex items-center gap-3 px-4 py-3">
                <label className="text-sm w-52 shrink-0 text-muted-foreground">{f.label}</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type={visible[f.key] ? "text" : "password"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="flex-1 bg-background border rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder={`Enter ${f.label}`}
                  />
                  <button
                    onClick={() => setVisible((v) => ({ ...v, [f.key]: !v[f.key] }))}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {visible[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving & Restarting..." : "Save & Restart App"}
        </button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </div>
    </div>
  )
}
