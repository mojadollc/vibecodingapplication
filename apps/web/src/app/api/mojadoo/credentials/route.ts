import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-guard"
import fs from "fs"
import path from "path"
import { exec } from "child_process"

const ENV_PATH = path.resolve(process.cwd(), ".env.local")

const ALLOWED_KEYS = [
  "OPENAI_API_KEY",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "XENDIT_SECRET_KEY",
  "XENDIT_WEBHOOK_TOKEN",
  "HITPAY_API_KEY",
  "HITPAY_SALT",
  "HITPAY_ENV",
  "COOLIFY_URL",
  "COOLIFY_TOKEN",
  "COOLIFY_SERVER_UUID",
  "BETTER_AUTH_SECRET",
]

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["']|["']$/g, "")
      result[key] = val
    }
  }
  return result
}

function buildEnv(existing: Record<string, string>, updates: Record<string, string>): string {
  const merged = { ...existing, ...updates }
  return Object.entries(merged)
    .map(([k, v]) => `${k}="${v}"`)
    .join("\n") + "\n"
}

export async function GET() {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf-8") : ""
  const all = parseEnv(content)
  const filtered = Object.fromEntries(
    Object.entries(all).filter(([k]) => ALLOWED_KEYS.includes(k))
  )
  return NextResponse.json({ data: filtered })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const { values } = await req.json() as { values: Record<string, string> }

  // Only allow whitelisted keys
  const safe = Object.fromEntries(
    Object.entries(values).filter(([k]) => ALLOWED_KEYS.includes(k))
  )

  const existing = fs.existsSync(ENV_PATH) ? parseEnv(fs.readFileSync(ENV_PATH, "utf-8")) : {}
  fs.writeFileSync(ENV_PATH, buildEnv(existing, safe), "utf-8")

  // Also update orchestrator .env
  const orchEnvPath = path.resolve(process.cwd(), "../../apps/orchestrator/.env")
  if (fs.existsSync(orchEnvPath) && safe.OPENAI_API_KEY) {
    const orchEnv = parseEnv(fs.readFileSync(orchEnvPath, "utf-8"))
    fs.writeFileSync(orchEnvPath, buildEnv(orchEnv, { OPENAI_API_KEY: safe.OPENAI_API_KEY }), "utf-8")
  }

  // Restart both PM2 processes
  exec("pm2 restart mojadoo-web mojadoo-orchestrator", () => {})

  return NextResponse.json({ message: "Saved & restarted successfully!" })
}
