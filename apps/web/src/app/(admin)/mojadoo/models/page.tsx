import { prisma } from "@mojadoo/database"
import ModelsManager from "@/components/admin/ModelsManager"

export const dynamic = "force-dynamic"

const DEFAULT_MODELS = [
  { modelId: "gpt-4o", label: "GPT-4o", provider: "OpenAI", isFast: false, sortOrder: 0 },
  { modelId: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", isFast: true, sortOrder: 1 },
  { modelId: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google", isFast: true, sortOrder: 2 },
  { modelId: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google", isFast: false, sortOrder: 3 },
  { modelId: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", provider: "Anthropic", isFast: false, sortOrder: 4 },
  { modelId: "llama3-70b-8192", label: "Llama 3 70B", provider: "Groq", isFast: true, sortOrder: 5 },
  { modelId: "mixtral-8x7b-32768", label: "Mixtral 8x7B", provider: "Groq", isFast: true, sortOrder: 6 },
  { modelId: "gemma2-9b-it", label: "Gemma 2 9B", provider: "Groq", isFast: true, sortOrder: 7 },
]

export default async function ModelsPage() {
  // Seed defaults if not exist
  for (const m of DEFAULT_MODELS) {
    await prisma.aiModelConfig.upsert({
      where: { modelId: m.modelId },
      update: {},
      create: { ...m, enabled: m.modelId === "gpt-4o" },
    })
  }

  const models = await prisma.aiModelConfig.findMany({ orderBy: { sortOrder: "asc" } })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">AI Models</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Enable or disable models available to users. Make sure the corresponding API key is set in Credentials.
      </p>
      <ModelsManager models={models} />
    </div>
  )
}
