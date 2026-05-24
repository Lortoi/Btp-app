import { INVOICE_SYSTEM_PROMPT, parseClaudeJson } from "@shared/invoicePrompt"
import type { ExtractedInvoice } from "@shared/invoiceTypes"

const CLAUDE_MODEL = "claude-sonnet-4-6"
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

function extractText(data: unknown): string {
  const content = (data as { content?: Array<{ type?: string; text?: string }> })?.content
  if (!Array.isArray(content)) return ""
  const block = content.find((c) => c.type === "text")
  return block?.text ?? ""
}

function isExtractedInvoice(value: unknown): value is ExtractedInvoice {
  if (!value || typeof value !== "object") return false
  const v = value as ExtractedInvoice
  return (
    typeof v.confidence === "number" &&
    v.client != null &&
    v.facture != null &&
    Array.isArray(v.lignes)
  )
}

export async function analyzeInvoicePdf(pdfBase64: string): Promise<ExtractedInvoice> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error(
      "Claude n'est pas configuré : définissez ANTHROPIC_API_KEY dans .env",
    )
  }

  const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "")

  const anthropicRes = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      temperature: 0,
      system: INVOICE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: cleanBase64,
              },
            },
            {
              type: "text",
              text: "Analyse cette facture et renvoie le JSON conforme aux règles du prompt système.",
            },
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
  if (!text.trim()) {
    throw new Error("Réponse vide de Claude")
  }

  const parsed = parseClaudeJson(text)
  if (!isExtractedInvoice(parsed)) {
    throw new Error("JSON extrait invalide ou incomplet")
  }

  return parsed
}
