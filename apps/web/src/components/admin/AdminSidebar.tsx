"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, DollarSign, Zap, Settings, ChevronLeft, KeyRound, BrainCircuit, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/mojadoo", label: "Overview", icon: LayoutDashboard },
  { href: "/mojadoo/users", label: "Users", icon: Users },
  { href: "/mojadoo/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/mojadoo/payments", label: "Payments", icon: DollarSign },
  { href: "/mojadoo/plans", label: "Plans", icon: Settings },
  { href: "/mojadoo/usage", label: "AI Usage", icon: Zap },
  { href: "/mojadoo/models", label: "AI Models", icon: BrainCircuit },
  { href: "/mojadoo/settings", label: "Settings", icon: SlidersHorizontal },
  { href: "/mojadoo/credentials", label: "Credentials", icon: KeyRound },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r flex flex-col bg-card shrink-0">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">Mojadoo</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to App
        </Link>
      </div>
    </aside>
  )
}
