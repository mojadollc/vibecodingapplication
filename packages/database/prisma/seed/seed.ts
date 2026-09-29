import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const plans = [
    {
      name: "Free",
      slug: "free",
      description: "Try before you buy",
      priceMonthly: 0,
      credits: 0,
      maxProjects: 3,
      sortOrder: 0,
    },
    {
      name: "Starter",
      slug: "starter",
      description: "For students & beginners",
      priceMonthly: 19900,
      credits: 300,
      maxProjects: 5,
      sortOrder: 1,
    },
    {
      name: "Builder",
      slug: "builder",
      description: "For freelancers",
      priceMonthly: 49900,
      credits: 1000,
      maxProjects: 15,
      sortOrder: 2,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For professionals — unlocks GPT-4o & Claude",
      priceMonthly: 99900,
      credits: 3000,
      maxProjects: 999,
      sortOrder: 3,
    },
    {
      name: "Agency",
      slug: "agency",
      description: "For teams & agencies",
      priceMonthly: 249900,
      credits: 10000,
      maxProjects: 999,
      sortOrder: 4,
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
