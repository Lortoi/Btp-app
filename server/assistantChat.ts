import { ASSISTANT_SYSTEM_PROMPT } from "@shared/assistantPrompt"

const ASSISTANT_MODEL = "claude-sonnet-4-5"
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

export type AssistantChatMessage = {
  role: "user" | "assistant"
  content: string
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

  const system = `${ASSISTANT_SYSTEM_PROMPT}\n\n--- DONNÉES DE L'ARTISAN (JSON) ---\n${params.context}`

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
      messages: params.messages.map((m) => ({
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
