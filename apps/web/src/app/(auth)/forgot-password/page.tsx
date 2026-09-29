"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"

const schema = z.object({
  email: z.string().email("Invalid email"),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError(null)
    const result = await authClient.forgetPassword({
      email: data.email,
      redirectTo: "/reset-password",
    })
    if (result.error) {
      setError(result.error.message ?? "Something went wrong")
      return
    }
    setSent(true)
  }

  return (
    <div className="bg-card border rounded-xl p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your email and we'll send a reset link
        </p>
      </div>

      {sent ? (
        <div className="text-sm text-center space-y-3">
          <p className="text-green-600 font-medium">Reset link sent!</p>
          <p className="text-muted-foreground">Check your email for the password reset link.</p>
          <Link href="/login" className="text-primary hover:underline block">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
