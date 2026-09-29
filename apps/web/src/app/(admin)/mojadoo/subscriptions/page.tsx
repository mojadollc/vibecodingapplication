import { prisma } from "@mojadoo/database"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function AdminSubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      plan: { select: { name: true, priceMonthly: true } },
    },
  })

  const mrr = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + s.plan.priceMonthly, 0) / 100

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="bg-card border rounded-lg px-4 py-2 text-sm">
          MRR: <span className="font-bold text-green-500">₱{mrr.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {["User", "Plan", "Status", "Provider", "Period End", "Amount"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {subscriptions.map((s) => (
              <tr key={s.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{s.user.name ?? s.user.email}</p>
                  <p className="text-xs text-muted-foreground">{s.user.email}</p>
                </td>
                <td className="px-4 py-3">{s.plan.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === "ACTIVE" ? "bg-green-500/10 text-green-600"
                    : s.status === "CANCELLED" ? "bg-muted text-muted-foreground"
                    : "bg-destructive/10 text-destructive"
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.provider}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {format(s.currentPeriodEnd, "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 font-medium">₱{(s.plan.priceMonthly / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
