"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "@/lib/auth-client"
import { authClient } from "@/lib/auth-client"

const nameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
})

type NameData = z.infer<typeof nameSchema>
type PasswordData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { data: session } = useSession()
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const nameForm = useForm<NameData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: session?.user.name ?? "" },
  })

  const pwForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  async function onNameSubmit(data: NameData) {
    setNameError(null)
    setNameSuccess(false)
    const result = await authClient.updateUser({ name: data.name })
    if (result.error) {
      setNameError(result.error.message ?? "Update failed")
      return
    }
    setNameSuccess(true)
  }

  async function onPasswordSubmit(data: PasswordData) {
    setPwError(null)
    setPwSuccess(false)
    const result = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    })
    if (result.error) {
      setPwError(result.error.message ?? "Password change failed")
      return
    }
    setPwSuccess(true)
    pwForm.reset()
  }

  return (
    <div className="p-8 max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account</p>
      </div>

      {/* Profile */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Email: </span>
          {session?.user.email}
        </div>
        <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Display name</label>
            <input
              {...nameForm.register("name")}
              type="text"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {nameForm.formState.errors.name && (
              <p className="text-destructive text-xs mt-1">{nameForm.formState.errors.name.message}</p>
            )}
          </div>
          {nameError && <p className="text-destructive text-sm">{nameError}</p>}
          {nameSuccess && <p className="text-green-600 text-sm">Name updated!</p>}
          <button
            type="submit"
            disabled={nameForm.formState.isSubmitting}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {nameForm.formState.isSubmitting ? "Saving..." : "Save name"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Change password</h2>
        <form onSubmit={pwForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Current password</label>
            <input
              {...pwForm.register("currentPassword")}
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {pwForm.formState.errors.currentPassword && (
              <p className="text-destructive text-xs mt-1">{pwForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">New password</label>
            <input
              {...pwForm.register("newPassword")}
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {pwForm.formState.errors.newPassword && (
              <p className="text-destructive text-xs mt-1">{pwForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <input
              {...pwForm.register("confirm")}
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {pwForm.formState.errors.confirm && (
              <p className="text-destructive text-xs mt-1">{pwForm.formState.errors.confirm.message}</p>
            )}
          </div>
          {pwError && <p className="text-destructive text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">Password changed!</p>}
          <button
            type="submit"
            disabled={pwForm.formState.isSubmitting}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {pwForm.formState.isSubmitting ? "Changing..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  )
}
