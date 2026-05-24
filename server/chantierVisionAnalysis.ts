import { parseClaudeJson } from "@shared/invoicePrompt"
import type { ChantierVisionReport } from "@shared/chantierVisionTypes"
import { CHANTIER_VISION_SYSTEM_PROMPT } from "@shared/chantierVisionPrompt"

const VISION_MODEL = "claude-sonnet-4-5"
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

function extractText(data: unknown): string {
  const content = (data as { content?: Array<{ type?: string; text?: string }> })?.content
  if (!Array.isArray(content)) return ""
  const block = content.find((c) => c.type === "text")
  return block?.text ?? ""
}

function isReport(value: unknown): value is ChantierVisionReport {
  if (!value || typeof value !== "object") return false
  const v = value as ChantierVisionReport
  return (
    typeof v.description_rendu === "string" &&
    Array.isArray(v.travaux_necessaires) &&
    typeof v.estimation_temps === "string" &&
    Array.isArray(v.recommandations_materiaux) &&
    Array.isArray(v.lignes_devis)
  )
}

export async function analyzeChantierVision(params: {
  imageBase64: string
  mediaType: "image/jpeg" | "image/png" | "image/webp"
  workTypeLabel: string
  goalDescription: string
}): Promise<ChantierVisionReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("Claude n'est pas configuré : définissez ANTHROPIC_API_KEY dans .env")
  }

  const cleanBase64 = params.imageBase64.replace(/^data:image\/\w+;base64,/, "")

  const userText = [
    `Type de travaux : ${params.workTypeLabel}`,
    `Objectif du client : ${params.goalDescription}`,
    "Analyse cette photo et produis le rapport JSON demandé.",
  ].join("\n")

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      max_tokens: 8192,
      temperature: 0,
      system: CHANTIER_VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: params.mediaType,
                data: cleanBase64,
              },
            },
            { type: "text", text: userText },
          ],
        },
      ],
    }),
  })

  if (!anthropicRes.ok) {
    const errBody = await anthropicRes.text()
    throw new Error(`Erreur API Anthropic (${anthropicRes.status}) : ${errBody.slice(0, 400)}`)
  }

  const data = (await anthropicRes.json()) as unknown
  const text = extractText(data)
  if (!text.trim()) throw new Error("Réponse vide de Claude")

  const parsed = parseClaudeJson(text)
  if (!isReport(parsed)) throw new Error("Rapport JSON invalide ou incomplet")

  return parsed
}
