import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string }
}) {
  const session = await auth.api.getSession({ headers: headers() })
  const userId = session!.user.id

  const [subscription, wallet, payments] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creditWallet.findUnique({ where: { userId } }),
    prisma.payment.findMany({
      where: { userId, status: "PAID" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {searchParams.success && (
        <div className="flex items-center gap-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg px-4 py-3 mb-6 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Payment successful! Your credits have been added.
        </div>
      )}

      {/* Current plan */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Current Plan</h2>
        {subscription ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-medium">{subscription.plan.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credits remaining</span>
              <span className="font-medium">{wallet?.balance ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Renews</span>
              <span className="font-medium">
                {format(subscription.currentPeriodEnd, "MMM d, yyyy")}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                <AlertCircle className="w-4 h-4" />
                Cancels on {format(subscription.currentPeriodEnd, "MMM d, yyyy")}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Plan</p>
              <p className="text-sm text-muted-foreground">{wallet?.balance ?? 0} credits remaining</p>
            </div>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Credit usage */}
      <div className="bg-card border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Credit Usage</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{wallet?.balance ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Remaining</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{wallet?.usedCredits ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Used</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{wallet?.lifetimeCredits ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
          </div>
        </div>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Payment History</h2>
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{p.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(p.createdAt, { addSuffix: true })} · {p.provider}
                  </p>
                </div>
                <span className="font-medium">₱{(p.amount / 100).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
