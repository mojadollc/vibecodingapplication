"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Terminal, CheckCircle2, XCircle, FileCode, Coins, ChevronDown, ChevronUp, Sparkles, FolderOpen, Play } from "lucide-react"
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
  initialPrompt?: string
  onFilesChanged?: () => void
  onProjectStatusChanged?: (status: string) => void
}

function estimateCost(text: string): number {
  const len = text.trim().length
  if (len === 0) return 0
  if (len < 50) return 0.5
  if (len < 150) return 1
  if (len < 400) return 2
  return 3
}

function StepIcon({ type, tool }: { type: AgentStep["type"]; tool?: string }) {
  if (type === "done") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
  if (type === "error") return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
  if (type === "thinking") return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
  if (tool === "create_file") return <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
  if (tool === "run_command") return <Terminal className="w-3.5 h-3.5 text-amber-500 shrink-0" />
  if (tool === "list_files") return <FolderOpen className="w-3.5 h-3.5 text-purple-500 shrink-0" />
  if (type === "tool_result") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
  return <Play className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
}

function ActivityFeed({ steps, isStreaming }: { steps: AgentStep[]; isStreaming?: boolean }) {
  const [expanded, setExpanded] = useState(true)

  // count files written
  const filesWritten = steps.filter((s) => s.tool === "create_file" && s.type === "tool_result").length
  const isDone = steps.some((s) => s.type === "done")
  const hasError = steps.some((s) => s.type === "error")

  // current active step (last non-done step while streaming)
  const activeStep = isStreaming ? [...steps].reverse().find((s) => s.type !== "done") : null

  if (steps.length === 0 && isStreaming) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        <span>Starting up...</span>
      </div>
    )
  }

  if (steps.length === 0) return null

  return (
    <div className="mt-2 w-full">
      {/* Summary bar */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
          isDone ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : hasError ? "bg-destructive/10 text-destructive"
          : "bg-primary/10 text-primary"
        )}
      >
        {isDone ? (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        ) : hasError ? (
          <XCircle className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        )}
        <span className="flex-1 text-left">
          {isDone
            ? `Done · ${filesWritten} file${filesWritten !== 1 ? "s" : ""} written`
            : hasError
            ? "Build failed"
            : activeStep?.message ?? "Building..."}
        </span>
        <span className="text-xs opacity-60">{steps.length} steps</span>
        {expanded ? <ChevronUp className="w-3 h-3 opacity-60" /> : <ChevronDown className="w-3 h-3 opacity-60" />}
      </button>

      {/* Step list */}
      {expanded && (
        <div className="mt-1 border rounded-lg overflow-hidden bg-muted/30">
          <div className="max-h-48 overflow-y-auto p-2 space-y-0.5">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 px-2 py-1.5 rounded-md text-xs",
                  step.type === "error" && "bg-destructive/5",
                  step.type === "done" && "bg-emerald-500/5",
                  step.type === "thinking" && i === steps.length - 1 && "bg-primary/5"
                )}
              >
                <span className="mt-0.5">
                  <StepIcon type={step.type} tool={step.tool} />
                </span>
                <span className={cn(
                  "leading-relaxed",
                  step.type === "error" ? "text-destructive"
                  : step.type === "done" ? "text-emerald-700 dark:text-emerald-400 font-medium"
                  : step.type === "thinking" && i === steps.length - 1 ? "text-primary"
                  : "text-muted-foreground"
                )}>
                  {step.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPanel({ project, conversation, initialPrompt, onFilesChanged, onProjectStatusChanged }: Props) {
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
  const [upgradeMessage, setUpgradeMessage] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const autoSentRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (initialPrompt && !autoSentRef.current && messages.length === 0) {
      autoSentRef.current = true
      setTimeout(() => sendMessageWithContent(initialPrompt), 300)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pollTask = useCallback(
    (taskId: string, assistantMsgId: string) => {
      let attempts = 0
      pollingRef.current = setInterval(async () => {
        attempts++
        try {
          const res = await fetch(`/api/projects/${project.id}/task?taskId=${taskId}`)

          if (!res.ok) {
            // Stop polling on persistent errors
            if (attempts > 3) {
              clearInterval(pollingRef.current!)
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: `Error ${res.status}: Could not track build progress. Check if the AI agent is running.`, isStreaming: false }
                    : m
                )
              )
              setSending(false)
            }
            return
          }

          const json = await res.json()
          if (!json.data) return

          const { task, projectStatus } = json.data
          const steps = (task.steps ?? []) as AgentStep[]

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, steps, isStreaming: task.status === "RUNNING" || task.status === "PENDING" } : m
            )
          )

          if (task.status === "DONE" || task.status === "FAILED") {
            clearInterval(pollingRef.current!)

            const lastDone = [...steps].reverse().find((s: AgentStep) => s.type === "done")
            const summary = lastDone?.message ?? (task.status === "FAILED" ? (task.error ?? "Build failed") : "Done")

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: summary, steps, isStreaming: false }
                  : m
              )
            )

            setSending(false)
            onFilesChanged?.()
            if (projectStatus?.status) onProjectStatusChanged?.(projectStatus.status)
          }
        } catch {
          if (attempts > 5) {
            clearInterval(pollingRef.current!)
            setSending(false)
          }
        }
      }, 1500)
    },
    [project.id, onFilesChanged, onProjectStatusChanged]
  )

  async function sendMessageWithContent(content: string) {
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
          setUpgradeMessage(json.error)
          setShowUpgrade(true)
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId && m.id !== userMsg.id))
          setSending(false)
          return
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: json.error, isStreaming: false } : m
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
              ? { ...m, content: "Orchestrator is offline. Please contact support.", isStreaming: false }
              : m
          )
        )
        setSending(false)
      }
    } catch {
      setSending(false)
    }
  }

  async function sendMessage() {
    await sendMessageWithContent(input.trim())
  }

  const cost = estimateCost(input)

  return (
    <>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} errorMessage={upgradeMessage} />}
      <div className="w-96 flex flex-col border-r bg-card shrink-0">
        <div className="h-10 border-b flex items-center gap-2 px-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">AI Chat</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium">What are we building?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Describe your app and I'll build it for you
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
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Building your app...</span>
                  </div>
                ) : (
                  msg.content || <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>

              {msg.role === "ASSISTANT" && (
                <div className="w-full max-w-[95%]">
                  <ActivityFeed steps={msg.steps ?? []} isStreaming={msg.isStreaming} />
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
            <div className="flex flex-col items-center justify-end gap-1.5">
              {cost > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Coins className="w-3 h-3" />
                  <span>{cost}</span>
                </div>
              )}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
