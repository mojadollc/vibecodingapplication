import { prisma } from "@mojadoo/database"
import { format } from "date-fns"
import AdminUserActions from "@/components/admin/AdminUserActions"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const [users, plans] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creditWallet: { select: { balance: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: { select: { id: true, name: true, slug: true } } },
          take: 1,
        },
        _count: { select: { projects: true } },
      },
    }),
    prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } }),
  ])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users ({users.length})</h1>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {["User", "Role", "Plan", "Credits", "Projects", "Joined", "Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => {
              const activeSub = u.subscriptions[0]
              return (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {activeSub?.plan.name ?? "Free"}
                  </td>
                  <td className="px-4 py-3">{u.creditWallet?.balance ?? 0}</td>
                  <td className="px-4 py-3">{u._count.projects}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {format(u.createdAt, "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <AdminUserActions
                      userId={u.id}
                      currentRole={u.role}
                      currentPlanId={activeSub?.plan.id ?? null}
                      currentPlanSlug={activeSub?.plan.slug ?? null}
                      plans={plans}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
