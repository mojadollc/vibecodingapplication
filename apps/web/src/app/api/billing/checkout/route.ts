import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createCheckout } from "@/lib/payment"
import { z } from "zod"

const schema = z.object({
  planId: z.string(),
  provider: z.enum(["XENDIT", "HITPAY"]),
})

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const result = await createCheckout(session.user.id, parsed.data.planId, parsed.data.provider, appUrl)
    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
