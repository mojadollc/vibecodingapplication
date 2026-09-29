export const dynamic = "force-dynamic"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import TemplatesManager from "@/components/admin/TemplatesManager"

export default async function TemplatesPage() {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) redirect("/login")
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage the templates shown to users when creating a new project.</p>
      </div>
      <TemplatesManager />
    </div>
  )
}
