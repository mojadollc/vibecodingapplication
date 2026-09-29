import { prisma } from "@mojadoo/database"
import SettingsManager from "@/components/admin/SettingsManager"

export const dynamic = "force-dynamic"

const DEFAULTS: Record<string, string> = {
  site_name: "Mojadoo",
  site_tagline: "Build apps with AI",
  maintenance_mode: "false",
  allow_signups: "true",
  free_daily_credits: "5",
  free_monthly_credits: "25",
  default_free_model: "gemini-2.0-flash",
  credit_cost_small: "1",
  credit_cost_medium: "2",
  credit_cost_large: "3",
  max_iterations: "40",
}

export default async function SettingsPage() {
  // Seed defaults if not exist
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: {},
      create: { key, value },
    })
  }

  const configs = await prisma.systemConfig.findMany({ orderBy: { key: "asc" } })
  const settings = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Global Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Control platform-wide behavior. Changes take effect immediately.
      </p>
      <SettingsManager settings={settings} />
    </div>
  )
}
