import { prisma } from "@mojadoo/database"
import { format } from "date-fns"

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  })

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="bg-card border rounded-lg px-4 py-2 text-sm">
          Total collected: <span className="font-bold text-green-500">₱{(totalPaid / 100).toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {["User", "Amount", "Status", "Provider", "Description", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{p.user.email}</td>
                <td className="px-4 py-3 font-medium">₱{(p.amount / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.status === "PAID" ? "bg-green-500/10 text-green-600"
                    : p.status === "FAILED" ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.provider}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">{p.description}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{format(p.createdAt, "MMM d, yyyy")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
