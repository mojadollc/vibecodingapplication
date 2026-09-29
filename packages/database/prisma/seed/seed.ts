import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const plans = [
    {
      name: "Free",
      slug: "free",
      description: "Try before you buy — 5 credits/day",
      priceMonthly: 0,
      credits: 0,
      maxProjects: 3,
      sortOrder: 0,
    },
    {
      name: "Starter",
      slug: "starter",
      description: "For students & beginners",
      priceMonthly: 19900, // ₱199
      credits: 200,
      maxProjects: 5,
      sortOrder: 1,
    },
    {
      name: "Builder",
      slug: "builder",
      description: "For freelancers — unlocks GPT-4o Mini",
      priceMonthly: 49900, // ₱499
      credits: 1000,
      maxProjects: 15,
      sortOrder: 2,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For professionals — unlocks GPT-4o & Claude",
      priceMonthly: 99900, // ₱999
      credits: 3000,
      maxProjects: 999,
      sortOrder: 3,
    },
    {
      name: "Agency",
      slug: "agency",
      description: "For teams & agencies — all models, unlimited projects",
      priceMonthly: 249900, // ₱2,499
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

  const templates = [
    { name: "Blank", slug: "blank", description: "Start from scratch", category: "General", prompt: "", icon: "layout", sortOrder: 0 },
    { name: "POS System", slug: "pos", description: "Point of sale for retail stores", category: "Business", prompt: "Build a complete POS (Point of Sale) system with: product catalog with categories, shopping cart, checkout flow, cash/card payment recording, daily & monthly sales reports, inventory management with low-stock alerts, and receipt printing. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "shopping-cart", sortOrder: 1 },
    { name: "Delivery App", slug: "delivery", description: "Food or package delivery platform", category: "Logistics", prompt: "Build a delivery app with: customer order placement with address input, driver assignment panel, real-time order status tracking (placed/preparing/picked-up/delivered), merchant dashboard with order management, earnings summary, and admin panel. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "truck", sortOrder: 2 },
    { name: "Task Manager", slug: "task-manager", description: "Project and task tracking", category: "Productivity", prompt: "Build a task management app with: workspaces, projects, tasks with status (todo/in-progress/done), priority levels, due dates, assignees, kanban board view, list view, and a dashboard with task stats. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "clipboard-list", sortOrder: 3 },
    { name: "CRM", slug: "crm", description: "Customer relationship management", category: "Business", prompt: "Build a CRM system with: contacts with full profile, companies, deals pipeline with drag-and-drop stages, activity log, notes, email history, and a dashboard with conversion metrics and revenue forecast. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "users", sortOrder: 4 },
    { name: "Analytics Dashboard", slug: "analytics", description: "Data visualization dashboard", category: "Analytics", prompt: "Build an analytics dashboard with: KPI metric cards, line charts for trends, bar charts for comparisons, pie charts for distribution, data tables with sorting/filtering, date range picker, and CSV export. Use Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and recharts.", icon: "bar-chart", sortOrder: 5 },
    { name: "E-Commerce Store", slug: "ecommerce", description: "Online shop with cart and checkout", category: "Business", prompt: "Build a full e-commerce store with: product listing with search and filters, product detail page, shopping cart, checkout with shipping address, order summary, order history page, and an admin panel to manage products and orders. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "store", sortOrder: 6 },
    { name: "Booking System", slug: "booking", description: "Appointment and reservation management", category: "Business", prompt: "Build a booking/appointment system with: service catalog, staff profiles, calendar availability view, booking form with date/time picker, confirmation page, booking management dashboard for staff, and email notification placeholders. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "calendar", sortOrder: 7 },
    { name: "HR Management", slug: "hrms", description: "Employee and payroll management", category: "Business", prompt: "Build an HR management system with: employee directory with profiles, department management, attendance tracking, leave request and approval workflow, payroll summary per employee, and an HR dashboard with headcount and leave stats. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "briefcase", sortOrder: 8 },
    { name: "Inventory System", slug: "inventory", description: "Stock and warehouse management", category: "Business", prompt: "Build an inventory management system with: product/SKU catalog, stock-in and stock-out recording, supplier management, purchase orders, low-stock alerts, inventory valuation report, and a dashboard with stock movement charts. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "package", sortOrder: 9 },
    { name: "Blog / CMS", slug: "blog", description: "Content management and publishing", category: "Content", prompt: "Build a blog and CMS with: post editor with rich text (markdown support), categories and tags, draft/publish workflow, featured image, author profiles, public blog listing with search, single post page, and an admin dashboard to manage all posts. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "file-text", sortOrder: 10 },
    { name: "School Management", slug: "school", description: "Students, classes, and grades", category: "Education", prompt: "Build a school management system with: student enrollment, class and section management, subject assignment, teacher profiles, grade recording per subject, report card generation, attendance tracking, and a principal dashboard with enrollment and performance stats. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "graduation-cap", sortOrder: 11 },
    { name: "Finance Tracker", slug: "finance", description: "Personal or business budgeting", category: "Finance", prompt: "Build a finance tracker with: income and expense recording with categories, recurring transactions, monthly budget setting, budget vs actual comparison, spending breakdown pie chart, transaction history with filters, and a net worth summary dashboard. Use Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and recharts.", icon: "wallet", sortOrder: 12 },
    { name: "Support Ticketing", slug: "helpdesk", description: "Customer support ticket system", category: "Productivity", prompt: "Build a customer support helpdesk with: ticket submission form, ticket list with status (open/in-progress/resolved/closed), priority levels, agent assignment, internal notes, customer reply thread, SLA timer display, and an agent dashboard with ticket stats. Use Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui.", icon: "headphones", sortOrder: 13 },
  ]

  for (const t of templates) {
    await prisma.projectTemplate.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    })
    console.log(`Upserted template: ${t.name}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
