import { prisma } from "@mojadoo/database"
import AdminPlanEditor from "@/components/admin/AdminPlanEditor"

export const dynamic = "force-dynamic"

export default async function AdminPlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Subscription Plans</h1>
      <AdminPlanEditor plans={plans} />
    </div>
  )
}
