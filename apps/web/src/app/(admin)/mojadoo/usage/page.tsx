import { prisma } from "@mojadoo/database"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function AdminUsagePage() {
  const [tasks, topUsers] = await Promise.all([
    prisma.aiTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { project: { select: { name: true, user: { select: { email: true } } } } },
    }),
    prisma.creditWallet.findMany({
      orderBy: { usedCredits: "desc" },
      take: 10,
      include: { user: { select: { email: true, name: true } } },
    }),
  ])

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">AI Usage</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-card border rounded-xl p-4">
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{status.toLowerCase()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Top Credit Users</h2>
          <div className="space-y-3">
            {topUsers.map((w) => (
              <div key={w.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{w.user.name ?? w.user.email}</p>
                  <p className="text-xs text-muted-foreground">{w.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{w.usedCredits} used</p>
                  <p className="text-xs text-muted-foreground">{w.balance} remaining</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Recent AI Tasks</h2>
          <div className="space-y-3">
            {tasks.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-start justify-between text-sm gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.project.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.prompt.slice(0, 60)}...</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === "DONE" ? "bg-green-500/10 text-green-600"
                    : t.status === "FAILED" ? "bg-destructive/10 text-destructive"
                    : "bg-yellow-500/10 text-yellow-600"
                  }`}>
                    {t.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{format(t.createdAt, "MMM d")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
