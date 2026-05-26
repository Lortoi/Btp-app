import { ASSISTANT_SYSTEM_PROMPT } from "@shared/assistantPrompt"

const ASSISTANT_MODEL = "claude-sonnet-4-5"
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
const MAX_CONTEXT_LEN = 120_000
const MAX_MESSAGE_LEN = 4000

export type AssistantChatMessage = {
  role: "user" | "assistant"
  content: string
}

function sanitizeText(value: unknown, maxLen = MAX_MESSAGE_LEN): string {
  if (value == null) return ""
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .trim()
    .slice(0, maxLen)
}

function normalizeMessages(raw: AssistantChatMessage[]): AssistantChatMessage[] {
  const cleaned: AssistantChatMessage[] = []
  for (const item of raw) {
    const role = item.role === "assistant" ? "assistant" : "user"
    const content = sanitizeText(item.content)
    if (!content) continue
    const last = cleaned[cleaned.length - 1]
    if (last && last.role === role) {
      last.content = `${last.content}\n${content}`.slice(0, MAX_MESSAGE_LEN)
    } else {
      cleaned.push({ role, content })
    }
  }
  if (cleaned.length === 0) return []
  if (cleaned[0].role !== "user") cleaned.shift()
  while (cleaned.length > 0 && cleaned[cleaned.length - 1].role !== "user") {
    cleaned.pop()
  }
  return cleaned
}

function extractText(data: unknown): string {
  const content = (data as { content?: Array<{ type?: string; text?: string }> })?.content
  if (!Array.isArray(content)) return ""
  const block = content.find((c) => c.type === "text")
  return block?.text ?? ""
}

export async function chatWithAssistant(params: {
  messages: AssistantChatMessage[]
  context: string
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("Claude n'est pas configuré : définissez ANTHROPIC_API_KEY dans .env")
  }

  if (params.messages.length === 0) {
    throw new Error("Au moins un message utilisateur est requis.")
  }

  const context = sanitizeText(params.context, MAX_CONTEXT_LEN)
  if (!context) {
    throw new Error("Contexte métier vide.")
  }
  try {
    const parsed = JSON.parse(context) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Contexte JSON invalide.")
    }
  } catch (e) {
    if (e instanceof Error && e.message === "Contexte JSON invalide.") throw e
    throw new Error("Contexte JSON illisible.")
  }

  const messages = normalizeMessages(params.messages)
  if (messages.length === 0) {
    throw new Error("Aucun message valide après normalisation.")
  }
  if (messages[messages.length - 1].role !== "user") {
    throw new Error("Le dernier message doit être utilisateur.")
  }

  const system = `${ASSISTANT_SYSTEM_PROMPT}\n\n--- DONNÉES DE L'ARTISAN (JSON) ---\n${context}`

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ASSISTANT_MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!anthropicRes.ok) {
    const errBody = await anthropicRes.text()
    throw new Error(`Erreur API Anthropic (${anthropicRes.status}) : ${errBody.slice(0, 400)}`)
  }

  const data = (await anthropicRes.json()) as unknown
  const text = extractText(data)
  if (!text.trim()) throw new Error("Réponse vide de Claude")
  return text.trim()
}
