import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@mojadoo/database"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state") // userId

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard?github=error", req.url))
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`,
      }),
    })

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string }

    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/dashboard?github=error", req.url))
    }

    // Store token on user (state = userId)
    await prisma.user.update({
      where: { id: state },
      data: { githubAccessToken: tokenData.access_token },
    })

    return NextResponse.redirect(new URL("/dashboard?github=connected", req.url))
  } catch {
    return NextResponse.redirect(new URL("/dashboard?github=error", req.url))
  }
}
