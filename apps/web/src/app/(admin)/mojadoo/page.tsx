import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import { Users, CreditCard, Zap, TrendingUp, FolderOpen, Rocket } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [
    totalUsers,
    activeSubscriptions,
    totalPayments,
    totalProjects,
    totalDeployments,
    aiUsage,
    recentUsers,
    recentPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
    prisma.project.count(),
    prisma.deployment.count({ where: { status: "SUCCESS" } }),
    prisma.aiTask.count({ where: { status: "DONE" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true, role: true } }),
    prisma.payment.findMany({ where: { status: "PAID" }, orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { email: true } } } }),
  ])

  const mrr = (totalPayments._sum.amount ?? 0) / 100

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Active Subscriptions", value: activeSubscriptions, icon: CreditCard, color: "text-green-500" },
    { label: "Total Revenue", value: `₱${mrr.toLocaleString()}`, icon: TrendingUp, color: "text-yellow-500" },
    { label: "Total Projects", value: totalProjects, icon: FolderOpen, color: "text-purple-500" },
    { label: "Deployments", value: totalDeployments, icon: Rocket, color: "text-orange-500" },
    { label: "AI Tasks Done", value: aiUsage, icon: Zap, color: "text-primary" },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Recent Users</h2>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{u.name ?? u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Recent Payments</h2>
          <div className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{p.user.email}</p>
                  <p className="text-xs text-muted-foreground">{p.provider} · {p.description}</p>
                </div>
                <span className="font-semibold">₱{(p.amount / 100).toFixed(2)}</span>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
