"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Terminal, CheckCircle2, XCircle, FileCode } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Project, Conversation, Message } from "@mojadoo/database"
import UpgradeModal from "@/components/billing/UpgradeModal"

interface AgentStep {
  type: "thinking" | "tool_call" | "tool_result" | "error" | "done"
  message: string
  tool?: string
}

interface ChatMessage {
  id: string
  role: "USER" | "ASSISTANT"
  content: string
  steps?: AgentStep[]
  isStreaming?: boolean
}

interface Props {
  project: Project
  conversation: (Conversation & { messages: Message[] }) | null
  onFilesChanged?: () => void
  onProjectStatusChanged?: (status: string) => void
}

export default function ChatPanel({ project, conversation, onFilesChanged, onProjectStatusChanged }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    (conversation?.messages ?? []).map((m) => ({
      id: m.id,
      role: m.role as "USER" | "ASSISTANT",
      content: m.content,
    }))
  )
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState(conversation?.id ?? "")
  const [showUpgrade, setShowUpgrade] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const pollTask = useCallback(
    (taskId: string, assistantMsgId: string) => {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/projects/${project.id}/task?taskId=${taskId}`)
          const json = await res.json()
          if (!json.data) return

          const { task, projectStatus } = json.data
          const steps = (task.steps ?? []) as AgentStep[]

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, steps, isStreaming: task.status === "RUNNING" } : m
            )
          )

          if (task.status === "DONE" || task.status === "FAILED") {
            clearInterval(pollingRef.current!)

            const lastDone = [...steps].reverse().find((s: AgentStep) => s.type === "done")
            const summary = lastDone?.message ?? (task.status === "FAILED" ? task.error : "Done")

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: summary ?? "Done", steps, isStreaming: false }
                  : m
              )
            )

            setSending(false)
            onFilesChanged?.()
            if (projectStatus?.status) onProjectStatusChanged?.(projectStatus.status)
          }
        } catch {
          clearInterval(pollingRef.current!)
          setSending(false)
        }
      }, 1500)
    },
    [project.id, onFilesChanged, onProjectStatusChanged]
  )

  async function sendMessage() {
    const content = input.trim()
    if (!content || sending) return

    setInput("")
    setSending(true)

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "USER", content }
    const assistantMsgId = crypto.randomUUID()
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "ASSISTANT",
      content: "",
      steps: [],
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])

    try {
      const res = await fetch(`/api/projects/${project.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, conversationId }),
      })
      const json = await res.json()

      if (json.error) {
        if (res.status === 402) {
          setShowUpgrade(true)
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId && m.id !== userMsg.id))
          setSending(false)
          return
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: json.error, isStreaming: false }
              : m
          )
        )
        setSending(false)
        return
      }

      if (json.data.conversationId) setConversationId(json.data.conversationId)

      if (json.data.taskId) {
        pollTask(json.data.taskId, assistantMsgId)
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: "Orchestrator is offline. Start it with: cd apps/orchestrator && pnpm dev", isStreaming: false }
              : m
          )
        )
        setSending(false)
      }
    } catch {
      setSending(false)
    }
  }

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <div className="w-96 flex flex-col border-r bg-card shrink-0">
      <div className="h-10 border-b flex items-center px-4">
        <span className="text-xs text-muted-foreground font-medium">AI Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Describe what you want to build</p>
            <p className="text-xs text-muted-foreground mt-1">
              e.g. "Build me a POS system for a sari-sari store"
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.role === "USER" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                msg.role === "USER"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {msg.isStreaming && !msg.content ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                msg.content || <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>

            {/* Agent steps */}
            {msg.role === "ASSISTANT" && msg.steps && msg.steps.length > 0 && (
              <div className="mt-2 w-full max-w-[85%] space-y-1">
                {msg.steps.map((step, i) => (
                  <StepRow key={i} step={step} />
                ))}
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Describe what you want to build..."
            rows={3}
            disabled={sending}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="self-end p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

function StepRow({ step }: { step: AgentStep }) {
  const icons: Record<string, React.ReactNode> = {
    thinking: <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />,
    tool_call: <Terminal className="w-3 h-3 text-blue-500" />,
    tool_result: <FileCode className="w-3 h-3 text-green-500" />,
    error: <XCircle className="w-3 h-3 text-destructive" />,
    done: <CheckCircle2 className="w-3 h-3 text-green-500" />,
  }

  return (
    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <span className="mt-0.5 shrink-0">{icons[step.type]}</span>
      <span className="truncate">{step.message}</span>
    </div>
  )
}
