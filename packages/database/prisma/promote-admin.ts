import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const email = process.argv[2]

async function main() {
  if (!email) {
    console.error("Usage: tsx prisma/promote-admin.ts <email>")
    process.exit(1)
  }

  const result = await prisma.user.updateMany({
    where: { email },
    data: { role: "ADMIN" },
  })

  if (result.count === 0) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  console.log(`✓ Promoted ${email} to ADMIN`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
