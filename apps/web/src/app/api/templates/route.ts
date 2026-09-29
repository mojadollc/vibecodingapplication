import { NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"

export async function GET() {
  const templates = await prisma.projectTemplate.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, description: true, category: true, icon: true, prompt: true },
  })
  return NextResponse.json({ data: templates })
}
