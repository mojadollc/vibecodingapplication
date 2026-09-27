import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import PricingCards from "@/components/billing/PricingCards"

export default async function PricingPage() {
  const session = await auth.api.getSession({ headers: headers() })
  const userId = session!.user.id

  const [plans, wallet, activeSub] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.creditWallet.findUnique({ where: { userId } }),
    prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
    }),
  ])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Choose your plan</h1>
        <p className="text-muted-foreground mt-2">
          You have <span className="font-semibold text-foreground">{wallet?.balance ?? 0} credits</span> remaining
        </p>
        {activeSub && (
          <p className="text-sm text-primary mt-1">
            Current plan: <span className="font-semibold">{activeSub.plan.name}</span>
          </p>
        )}
      </div>
      <PricingCards plans={plans} currentPlanId={activeSub?.planId} />
    </div>
  )
}
