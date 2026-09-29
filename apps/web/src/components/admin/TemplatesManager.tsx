"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, X, Check, GripVertical, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface Template {
  id: string
  name: string
  slug: string
  description: string
  category: string
  icon: string
  prompt: string
  isActive: boolean
  sortOrder: number
}

const ICON_OPTIONS = [
  "layout", "shopping-cart", "truck", "clipboard-list", "users", "bar-chart",
  "store", "calendar", "briefcase", "package", "file-text", "graduation-cap",
  "wallet", "headphones", "code", "globe", "database", "settings",
]

const CATEGORY_OPTIONS = [
  "General", "Business", "Logistics", "Productivity", "Analytics",
  "Content", "Education", "Finance", "Technology",
]

const empty: Omit<Template, "id"> = {
  name: "", slug: "", description: "", category: "Business",
  icon: "layout", prompt: "", isActive: true, sortOrder: 0,
}

export default function TemplatesManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState<Omit<Template, "id">>(empty)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)

  async function load() {
    const res = await fetch("/api/mojadoo/templates")
    const json = await res.json()
    setTemplates(json.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setIsNew(true)
    setEditing(null)
    setForm({ ...empty, sortOrder: templates.length })
  }

  function openEdit(t: Template) {
    setIsNew(false)
    setEditing(t)
    setForm({ name: t.name, slug: t.slug, description: t.description, category: t.category, icon: t.icon, prompt: t.prompt, isActive: t.isActive, sortOrder: t.sortOrder })
  }

  function closeForm() {
    setEditing(null)
    setIsNew(false)
  }

  async function save() {
    setSaving(true)
    if (isNew) {
      await fetch("/api/mojadoo/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    } else if (editing) {
      await fetch("/api/mojadoo/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      })
    }
    await load()
    closeForm()
    setSaving(false)
  }

  async function toggleActive(t: Template) {
    await fetch("/api/mojadoo/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, isActive: !t.isActive }),
    })
    setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, isActive: !x.isActive } : x))
  }

  async function remove(t: Template) {
    if (!confirm(`Delete "${t.name}"?`)) return
    await fetch(`/api/mojadoo/templates?id=${t.id}`, { method: "DELETE" })
    setTemplates((prev) => prev.filter((x) => x.id !== t.id))
  }

  // auto-generate slug from name
  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    setForm((f) => ({ ...f, name, slug: isNew ? slug : f.slug }))
  }

  const categories = Array.from(new Set(templates.map((t) => t.category)))

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} templates · {templates.filter((t) => t.isActive).length} active</p>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Template
        </button>
      </div>

      {/* Group by category */}
      {(categories.length ? categories : ["General"]).map((cat) => {
        const group = templates.filter((t) => t.category === cat)
        if (!group.length) return null
        return (
          <div key={cat}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
            <div className="space-y-1">
              {group.map((t) => (
                <div key={t.id} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card", !t.isActive && "opacity-50")}>
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t.icon}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(t)} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title={t.isActive ? "Disable" : "Enable"}>
                      {t.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(t)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Add/Edit modal */}
      {(isNew || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{isNew ? "Add Template" : `Edit: ${editing?.name}`}</h2>
              <button onClick={closeForm}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Name</label>
                  <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium">Slug</label>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                    {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Icon</label>
                  <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                    {ICON_OPTIONS.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">AI Prompt</label>
                <textarea value={form.prompt} onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  rows={6} placeholder="Describe what the AI should build for this template..."
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={cn("w-9 h-5 rounded-full transition-colors relative", form.isActive ? "bg-primary" : "bg-muted")}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", form.isActive ? "left-4" : "left-0.5")} />
                </button>
                <span className="text-sm">{form.isActive ? "Active (visible to users)" : "Inactive (hidden)"}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={closeForm} className="px-4 py-2 rounded-md border text-sm hover:bg-muted">Cancel</button>
              <button onClick={save} disabled={saving || !form.name || !form.slug}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">
                <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
