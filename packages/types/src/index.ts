export type { User, Project, Conversation, Message, CreditWallet } from "@mojadoo/database"

export type ProjectStatus = "IDLE" | "BUILDING" | "RUNNING" | "ERROR" | "DEPLOYED"
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM"
export type TransactionType = "CREDIT" | "DEBIT"

export interface CreateProjectInput {
  name: string
  description?: string
  framework?: string
}

export interface SendMessageInput {
  conversationId: string
  content: string
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
