import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { analyzeInvoicePdf } from "./invoiceAnalysis";
import { analyzeChantierVision } from "./chantierVisionAnalysis";
import { chatWithAssistant, type AssistantChatMessage } from "./assistantChat";

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

  app.post("/api/analyze-invoice", async (req: Request, res: Response) => {
    try {
      const pdfBase64 = req.body?.pdf_base64
      const filename = req.body?.filename

      if (typeof pdfBase64 !== "string" || pdfBase64.length < 100) {
        return res.status(400).json({ ok: false, message: "Le champ « pdf_base64 » est requis." })
      }
      if (typeof filename !== "string" || !filename.trim()) {
        return res.status(400).json({ ok: false, message: "Le champ « filename » est requis." })
      }

      const extraction = await analyzeInvoicePdf(pdfBase64)
      return res.json({ ok: true, extraction, filename: filename.trim() })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur serveur"
      return res.status(502).json({ ok: false, message })
    }
  });

  app.post("/api/analyze-chantier-vision", async (req: Request, res: Response) => {
    try {
      const imageBase64 = req.body?.image_base64
      const mediaType = req.body?.media_type
      const workTypeLabel = req.body?.work_type_label
      const goalDescription = req.body?.goal_description

      if (typeof imageBase64 !== "string" || imageBase64.length < 100) {
        return res.status(400).json({ ok: false, message: "image_base64 requis." })
      }
      if (mediaType !== "image/jpeg" && mediaType !== "image/png" && mediaType !== "image/webp") {
        return res.status(400).json({ ok: false, message: "media_type invalide (jpeg, png, webp)." })
      }
      if (typeof workTypeLabel !== "string" || !workTypeLabel.trim()) {
        return res.status(400).json({ ok: false, message: "work_type_label requis." })
      }
      if (typeof goalDescription !== "string" || !goalDescription.trim()) {
        return res.status(400).json({ ok: false, message: "goal_description requis." })
      }

      const report = await analyzeChantierVision({
        imageBase64,
        mediaType,
        workTypeLabel: workTypeLabel.trim(),
        goalDescription: goalDescription.trim(),
      })

      return res.json({ ok: true, report })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur serveur"
      return res.status(502).json({ ok: false, message })
    }
  });

  app.post("/api/assistant-chat", async (req: Request, res: Response) => {
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
        return res.status(400).json({ ok: false, message: "Le dernier message doit être utilisateur et non vide." })
      }

      const reply = await chatWithAssistant({
        messages: parsed,
        context: JSON.stringify(parsedContext),
      })
      return res.json({ ok: true, reply })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur serveur"
      return res.status(502).json({ ok: false, message })
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
