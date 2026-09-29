"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, X } from "lucide-react"
import TemplatePicker from "@/components/templates/TemplatePicker"

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewProjectButton() {
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("blank")
  const [templatePrompt, setTemplatePrompt] = useState("")
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  function handleTemplateSelect(slug: string, prompt: string) {
    setSelectedTemplate(slug)
    setTemplatePrompt(prompt)
    if (prompt) setValue("description", prompt.slice(0, 200))
  }

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, templatePrompt }),
    })
    const json = await res.json()
    if (json.data) {
      reset()
      setOpen(false)
      const url = templatePrompt
        ? `/projects/${json.data.id}?prompt=${encodeURIComponent(templatePrompt)}`
        : `/projects/${json.data.id}`
      router.push(url)
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
      >
        <Plus className="w-4 h-4" />
        New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">New Project</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Start from a template</label>
                <div className="mt-2">
                  <TemplatePicker selected={selectedTemplate} onSelect={handleTemplateSelect} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Project name</label>
                <input
                  {...register("name")}
                  placeholder="My awesome app"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium">Description / initial prompt</label>
                <textarea
                  {...register("description")}
                  placeholder="What are you building?"
                  rows={3}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-md border text-sm hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
