/**
 * Vercel Serverless Function — même contrat que POST /api/claude (Express).
 * Correspondance : `fetch("/api/claude", { method: "POST", body: JSON.stringify({ prompt }) })`
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  maxDuration: 60,
};

const CLAUDE_MODEL = "claude-sonnet-4-6";

function extractMessageText(data: unknown): string {
  const content = (data as { content?: Array<{ type?: string; text?: string }> })?.content;
  if (!Array.isArray(content)) return "";
  const block = content.find((c) => c.type === "text");
  return block?.text ?? "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const prompt = req.body?.prompt;
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ message: "Le champ « prompt » est requis." });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        message:
          "Claude n'est pas configuré : ajoutez ANTHROPIC_API_KEY dans les variables d'environnement Vercel.",
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        temperature: 0,
        messages: [{ role: "user", content: prompt.trim() }],
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      return res.status(502).json({
        message: `Erreur API Anthropic (${anthropicRes.status}).`,
        detail: errBody.slice(0, 800),
      });
    }

    const data = (await anthropicRes.json()) as unknown;
    const text = extractMessageText(data);
    return res.status(200).json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return res.status(500).json({ message });
  }
}
