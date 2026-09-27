import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.redirect(new URL("/login", req.url))

  const clientId = process.env.GITHUB_CLIENT_ID ?? ""
  if (!clientId) return NextResponse.json({ error: "GITHUB_CLIENT_ID not configured" }, { status: 500 })

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`
  const state = session.user.id // use userId as state for verification
  const scope = "repo,read:user"

  const url = new URL("https://github.com/login/oauth/authorize")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("scope", scope)
  url.searchParams.set("state", state)

  return NextResponse.redirect(url.toString())
}
