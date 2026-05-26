export type AssistantApiMessage = {
  role: "user" | "assistant"
  content: string
}

export type AssistantChatPayload = {
  context: string
  messages: AssistantApiMessage[]
}

const MAX_MESSAGE_LEN = 4000
const MAX_CONTEXT_LEN = 120_000

function sanitizeText(value: unknown, maxLen = MAX_MESSAGE_LEN): string {
  if (value == null) return ""
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .trim()
    .slice(0, maxLen)
}

/** Normalise l'historique pour l'API Claude (alternance user/assistant, dernier = user). */
export function normalizeAssistantMessages(
  raw: Array<{ role: string; content: unknown }>
): AssistantApiMessage[] {
  const cleaned: AssistantApiMessage[] = []

  for (const item of raw) {
    const role = item.role === "assistant" ? "assistant" : item.role === "user" ? "user" : null
    const content = sanitizeText(item.content)
    if (!role || !content) continue

    const last = cleaned[cleaned.length - 1]
    if (last && last.role === role) {
      last.content = `${last.content}\n${content}`.slice(0, MAX_MESSAGE_LEN)
    } else {
      cleaned.push({ role, content })
    }
  }

  if (cleaned.length === 0) return []
  if (cleaned[0].role !== "user") {
    cleaned.shift()
  }
  if (cleaned.length === 0) return []

  while (cleaned.length > 0 && cleaned[cleaned.length - 1].role !== "user") {
    cleaned.pop()
  }

  return cleaned
}

/** Valide et prépare le corps JSON avant l'appel /api/assistant-chat. */
export function prepareAssistantChatPayload(params: {
  contextJson: string
  history: Array<{ role: "user" | "assistant"; content: string }>
  userText: string
}): { payload: AssistantChatPayload } | { error: string } {
  const userText = sanitizeText(params.userText)
  if (!userText) {
    return { error: "Votre message est vide." }
  }

  const messages = normalizeAssistantMessages([
    ...params.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userText },
  ])

  if (messages.length === 0) {
    return { error: "Message utilisateur invalide." }
  }
  if (messages[messages.length - 1].role !== "user") {
    return { error: "Le dernier message doit être utilisateur." }
  }

  let context = sanitizeText(params.contextJson, MAX_CONTEXT_LEN)
  if (!context) {
    context = JSON.stringify({
      generatedAt: new Date().toISOString(),
      clients: [],
      chantiers: [],
      devis: [],
      factures: [],
      indicateurs: {},
      notes: ["Contexte métier indisponible sur cet appareil."],
    })
  } else {
    try {
      const parsed = JSON.parse(context) as unknown
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { error: "Contexte métier invalide." }
      }
      context = JSON.stringify(parsed)
    } catch {
      return { error: "Contexte métier illisible (données locales corrompues)." }
    }
  }

  if (context.length > MAX_CONTEXT_LEN) {
    context = context.slice(0, MAX_CONTEXT_LEN)
  }

  return { payload: { context, messages } }
}

export async function postAssistantChat(
  payload: AssistantChatPayload
): Promise<{ reply: string }> {
  let body: string
  try {
    body = JSON.stringify(payload)
  } catch {
    throw new Error("Impossible de préparer la requête (données invalides).")
  }

  if (!body || body.length < 10) {
    throw new Error("Requête vide : vérifiez votre message.")
  }

  const res = await fetch("/api/assistant-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })

  const rawText = await res.text()
  if (!rawText.trim()) {
    throw new Error(
      res.ok
        ? "Réponse vide du serveur."
        : `Erreur serveur (${res.status}). Réessayez dans un instant.`
    )
  }

  let data: { ok?: boolean; reply?: string; message?: string }
  try {
    data = JSON.parse(rawText) as { ok?: boolean; reply?: string; message?: string }
  } catch {
    throw new Error(
      res.ok
        ? "Réponse serveur illisible."
        : `Erreur serveur (${res.status}). Vérifiez votre connexion.`
    )
  }

  if (!res.ok || !data.ok || !data.reply?.trim()) {
    throw new Error(data.message ?? `Erreur serveur (${res.status}).`)
  }

  return { reply: data.reply.trim() }
}
