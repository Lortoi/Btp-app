/**
 * Vercel Serverless Function — même contrat que POST /api/assistant-chat (Express).
 * Client : fetch("/api/assistant-chat", { method: "POST", body: JSON.stringify({ context, messages }) })
 */
import type { VercelRequest, VercelResponse } from "@vercel/node"
import {
  chatWithAssistant,
  type AssistantChatMessage,
} from "../server/assistantChat"

export const config = {
  maxDuration: 60,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" })
  }

  try {
    const messages = req.body?.messages
    const context = req.body?.context

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ ok: false, message: "messages requis (tableau non vide)." })
    }
    if (typeof context !== "string" || !context.trim()) {
      return res.status(400).json({ ok: false, message: "context requis (chaîne JSON non vide)." })
    }

    let parsedContext: unknown
    try {
      parsedContext = JSON.parse(context.trim())
      if (!parsedContext || typeof parsedContext !== "object" || Array.isArray(parsedContext)) {
        return res.status(400).json({ ok: false, message: "context doit être un objet JSON valide." })
      }
    } catch {
      return res.status(400).json({ ok: false, message: "context JSON illisible." })
    }

    const parsed: AssistantChatMessage[] = []
    for (const m of messages) {
      if (
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
      ) {
        parsed.push({ role: m.role, content: m.content.trim().slice(0, 4000) })
      }
    }

    if (parsed.length === 0 || parsed[parsed.length - 1].role !== "user") {
      return res
        .status(400)
        .json({ ok: false, message: "Le dernier message doit être utilisateur et non vide." })
    }

    const reply = await chatWithAssistant({
      messages: parsed,
      context: JSON.stringify(parsedContext),
    })
    return res.status(200).json({ ok: true, reply })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur"
    return res.status(502).json({ ok: false, message })
  }
}
