import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@mojadoo/database"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // TODO: plug in your email provider here
      // For now, log the reset URL so you can test it
      console.log(`[Reset Password] ${user.email} → ${url}`)
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
})
