"use client"

import { ShoppingCart, Truck, ClipboardList, BarChart2, Users, Layout } from "lucide-react"
import { cn } from "@/lib/utils"

export const BUILT_IN_TEMPLATES = [
  {
    slug: "blank",
    name: "Blank",
    description: "Start from scratch",
    icon: "layout",
    category: "General",
    prompt: "",
  },
  {
    slug: "pos",
    name: "POS System",
    description: "Point of sale for retail stores",
    icon: "shopping-cart",
    category: "Business",
    prompt: "Build a complete POS (Point of Sale) system with: product catalog, cart, checkout, payment recording, daily sales report, and inventory management. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui components.",
  },
  {
    slug: "delivery",
    name: "Delivery App",
    description: "Food or package delivery platform",
    icon: "truck",
    category: "Logistics",
    prompt: "Build a delivery app with: customer order placement, driver assignment, real-time order tracking status, merchant dashboard, and admin panel. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.",
  },
  {
    slug: "task-manager",
    name: "Task Manager",
    description: "Project and task tracking",
    icon: "clipboard-list",
    category: "Productivity",
    prompt: "Build a task management app with: projects, tasks with status (todo/in-progress/done), due dates, assignees, kanban board view, and list view. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.",
  },
  {
    slug: "crm",
    name: "CRM",
    description: "Customer relationship management",
    icon: "users",
    category: "Business",
    prompt: "Build a CRM system with: contacts, companies, deals pipeline, activity log, notes, and a dashboard with key metrics. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.",
  },
  {
    slug: "analytics",
    name: "Analytics Dashboard",
    description: "Data visualization dashboard",
    icon: "bar-chart",
    category: "Analytics",
    prompt: "Build an analytics dashboard with: key metric cards, line charts, bar charts, data tables, date range filter, and export to CSV. Use Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and recharts.",
  },
]

const iconMap: Record<string, React.ReactNode> = {
  layout: <Layout className="w-5 h-5" />,
  "shopping-cart": <ShoppingCart className="w-5 h-5" />,
  truck: <Truck className="w-5 h-5" />,
  "clipboard-list": <ClipboardList className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  "bar-chart": <BarChart2 className="w-5 h-5" />,
}

interface Props {
  selected: string
  onSelect: (slug: string, prompt: string) => void
}

export default function TemplatePicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {BUILT_IN_TEMPLATES.map((t) => (
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
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center",
            selected === t.slug ? "bg-primary/10" : "bg-muted"
          )}>
            {iconMap[t.icon]}
          </div>
          <div>
            <p className="text-xs font-medium leading-tight">{t.name}</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 hidden sm:block">{t.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
