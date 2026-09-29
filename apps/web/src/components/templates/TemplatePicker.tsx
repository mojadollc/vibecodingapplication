"use client"

import { useState, useEffect } from "react"
import {
  Layout, ShoppingCart, Truck, ClipboardList, BarChart2, Users,
  Store, Calendar, Briefcase, Package, FileText, GraduationCap,
  Wallet, Headphones, Code, Globe, Database, Settings, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Template {
  id: string
  name: string
  slug: string
  description: string
  category: string
  icon: string
  prompt: string
}

const iconMap: Record<string, React.ReactNode> = {
  layout: <Layout className="w-5 h-5" />,
  "shopping-cart": <ShoppingCart className="w-5 h-5" />,
  truck: <Truck className="w-5 h-5" />,
  "clipboard-list": <ClipboardList className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  "bar-chart": <BarChart2 className="w-5 h-5" />,
  store: <Store className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
  package: <Package className="w-5 h-5" />,
  "file-text": <FileText className="w-5 h-5" />,
  "graduation-cap": <GraduationCap className="w-5 h-5" />,
  wallet: <Wallet className="w-5 h-5" />,
  headphones: <Headphones className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  database: <Database className="w-5 h-5" />,
  settings: <Settings className="w-5 h-5" />,
}

interface Props {
  selected: string
  onSelect: (slug: string, prompt: string) => void
}

export default function TemplatePicker({ selected, onSelect }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((json) => {
        setTemplates(json.data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))]
  const filtered = activeCategory === "All" ? templates : templates.filter((t) => t.category === activeCategory)

  return (
    <div className="space-y-3">
      {/* Category filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map((t) => (
          <button
            key={t.slug}
            onClick={() => onSelect(t.slug, t.prompt)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors",
              selected === t.slug
                ? "border-primary bg-primary/5 text-primary"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              selected === t.slug ? "bg-primary/10" : "bg-muted"
            )}>
              {iconMap[t.icon] ?? <Layout className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-medium leading-tight">{t.name}</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5 hidden sm:block line-clamp-2">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
