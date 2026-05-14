import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

const CLAUDE_MODEL = "claude-sonnet-4-6";

/** Extrait le texte assistant brut de la réponse Messages API. */
function extractMessageText(data: unknown): string {
  const content = (data as { content?: Array<{ type?: string; text?: string }> })?.content;
  if (!Array.isArray(content)) return "";
  const block = content.find((c) => c.type === "text");
  return block?.text ?? "";
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/claude", async (req: Request, res: Response) => {
    try {
      const prompt = req.body?.prompt;
      if (typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ message: "Le champ « prompt » est requis." });
      }

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          message:
            "Claude n'est pas configuré : définissez ANTHROPIC_API_KEY dans l'environnement du serveur.",
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
      return res.json({ text });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur serveur";
      return res.status(500).json({ message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
