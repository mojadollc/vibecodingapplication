import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const plans = [
    {
      name: "Free",
      slug: "free",
      description: "Get started for free",
      priceMonthly: 0,
      credits: 50,
      maxProjects: 3,
      sortOrder: 0,
    },
    {
      name: "Starter",
      slug: "starter",
      description: "For indie developers",
      priceMonthly: 29900, // ₱299.00 in centavos
      credits: 500,
      maxProjects: 10,
      sortOrder: 1,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For serious builders",
      priceMonthly: 79900, // ₱799.00
      credits: 2000,
      maxProjects: 999,
      sortOrder: 2,
    },
    {
      name: "Business",
      slug: "business",
      description: "For teams and agencies",
      priceMonthly: 199900, // ₱1,999.00
      credits: 10000,
      maxProjects: 999,
      sortOrder: 3,
    },
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    })
    console.log(`Upserted plan: ${plan.name}`)
  }
}

  // Seed project templates
  const templates = [
    { name: "Blank", slug: "blank", description: "Start from scratch", category: "General", prompt: "", icon: "layout", sortOrder: 0 },
    { name: "POS System", slug: "pos", description: "Point of sale for retail stores", category: "Business", prompt: "Build a complete POS system with product catalog, cart, checkout, payment recording, daily sales report, and inventory management. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "shopping-cart", sortOrder: 1 },
    { name: "Delivery App", slug: "delivery", description: "Food or package delivery platform", category: "Logistics", prompt: "Build a delivery app with customer order placement, driver assignment, real-time order tracking status, merchant dashboard, and admin panel. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "truck", sortOrder: 2 },
    { name: "Task Manager", slug: "task-manager", description: "Project and task tracking", category: "Productivity", prompt: "Build a task management app with projects, tasks with status (todo/in-progress/done), due dates, assignees, kanban board view, and list view. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "clipboard-list", sortOrder: 3 },
    { name: "CRM", slug: "crm", description: "Customer relationship management", category: "Business", prompt: "Build a CRM system with contacts, companies, deals pipeline, activity log, notes, and a dashboard with key metrics. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "users", sortOrder: 4 },
    { name: "Analytics Dashboard", slug: "analytics", description: "Data visualization dashboard", category: "Analytics", prompt: "Build an analytics dashboard with key metric cards, line charts, bar charts, data tables, date range filter, and export to CSV. Use Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and recharts.", icon: "bar-chart", sortOrder: 5 },
  ]

  for (const t of templates) {
    await prisma.projectTemplate.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    })
    console.log(`Upserted template: ${t.name}`)
  }

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
