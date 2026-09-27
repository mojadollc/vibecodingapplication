import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@mojadoo/database"
import Sidebar from "@/components/layout/Sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={session.user} isAdmin={user?.role === "ADMIN"} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
