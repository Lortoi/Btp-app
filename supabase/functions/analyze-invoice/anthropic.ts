/**
 * Wrapper léger autour de l'API Anthropic Messages.
 * Pas de SDK npm : fetch direct, retry manuel, types maison.
 *
 * SECURITY: la clé `ANTHROPIC_API_KEY` doit être stockée comme Secret Supabase
 * (commande : `supabase secrets set ANTHROPIC_API_KEY=...`). Elle n'apparaît
 * jamais côté client.
 *
 * SECURITY: Zero Data Retention doit être activé sur le compte Anthropic
 * avant la mise en prod (sinon Anthropic conserve les inputs/outputs 30 jours).
 * Voir https://docs.claude.com/en/docs/legal-and-compliance/data-usage
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

// Modèle utilisé.
// - `claude-sonnet-4-6` = alias dateless, modèle Sonnet courant (mai 2026).
// - Sonnet 4.5 a été remplacé par 4.6 au même tarif ($3/$15 par M tokens),
//   avec plus d'intelligence (cf. Anthropic migration guide).
// - Si besoin d'épingler à une date précise pour la reproductibilité, utiliser
//   `claude-sonnet-4-5-20250929` (dernière version datée de Sonnet 4.5).
// Vérifier les modèles disponibles via GET /v1/models ou
// https://docs.claude.com/en/docs/about-claude/models/overview
export const MODEL = "claude-sonnet-4-6";

// Limites
const MAX_TOKENS = 8192;        // Sortie max (assez large pour 50 lignes)
const TEMPERATURE = 0;          // Déterministe
const TIMEOUT_MS = 55_000;      // Sous les 60s de timeout Edge Function
const MAX_RETRIES = 1;          // 1 retry sur 5xx / 429 / timeout

// Tarif Sonnet 4.5 en USD/M-tokens (à mettre à jour si Anthropic change).
// Vérifier : https://docs.claude.com/en/docs/about-claude/pricing
const PRICE_INPUT_USD_PER_M = 3;
const PRICE_OUTPUT_USD_PER_M = 15;

// Taux de change approximatif USD → EUR. À actualiser si besoin (hors scope MVP).
const USD_TO_EUR = 0.92;

export interface AnthropicCallResult {
  /** Texte brut renvoyé par Claude (devrait être un JSON). */
  text: string;
  /** Nombre de tokens d'input facturés. */
  inputTokens: number;
  /** Nombre de tokens d'output facturés. */
  outputTokens: number;
  /** Coût estimé en EUR. */
  costEur: number;
  /** Nom du modèle utilisé (echo de la réponse Anthropic). */
  model: string;
}

export interface AnthropicError {
  status: number;
  type: string;
  message: string;
}

export class AnthropicCallError extends Error {
  readonly status: number;
  readonly type: string;
  constructor(err: AnthropicError) {
    super(err.message);
    this.name = "AnthropicCallError";
    this.status = err.status;
    this.type = err.type;
  }
}

/**
 * Appelle Claude avec un PDF en base64 + un prompt système. Retourne le texte
 * de la réponse + l'usage de tokens + le coût estimé.
 *
 * @throws AnthropicCallError si l'API renvoie une erreur après tous les retries
 */
export async function callClaudeWithPdf(params: {
  apiKey: string;
  systemPrompt: string;
  pdfBase64: string;
}): Promise<AnthropicCallResult> {
  const { apiKey, systemPrompt, pdfBase64 } = params;

  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: "Analyse cette facture et renvoie le JSON conforme aux règles du prompt système.",
          },
        ],
      },
    ],
  };

  let lastError: AnthropicError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify(body),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const text = extractText(json);
        const inputTokens = json?.usage?.input_tokens ?? 0;
        const outputTokens = json?.usage?.output_tokens ?? 0;
        const costUsd =
          (inputTokens * PRICE_INPUT_USD_PER_M) / 1_000_000 +
          (outputTokens * PRICE_OUTPUT_USD_PER_M) / 1_000_000;
        return {
          text,
          inputTokens,
          outputTokens,
          costEur: round4(costUsd * USD_TO_EUR),
          model: json?.model ?? MODEL,
        };
      }

      // Erreur API : on retry si 5xx ou 429, on lâche sinon
      const errBody = await safeReadJson(res);
      lastError = {
        status: res.status,
        type: errBody?.error?.type ?? "unknown_error",
        message: errBody?.error?.message ?? `HTTP ${res.status}`,
      };

      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === MAX_RETRIES) {
        throw new AnthropicCallError(lastError);
      }
      await sleep(2000);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof AnthropicCallError) throw err;

      // AbortError (timeout) ou erreur réseau → retryable
      const isTimeout = (err as Error)?.name === "AbortError";
      lastError = {
        status: isTimeout ? 408 : 0,
        type: isTimeout ? "timeout" : "network_error",
        message: (err as Error)?.message ?? "Unknown network error",
      };
      if (attempt === MAX_RETRIES) {
        throw new AnthropicCallError(lastError);
      }
      await sleep(2000);
    }
  }

  // Inatteignable, mais TypeScript exige une sortie
  throw new AnthropicCallError(
    lastError ?? { status: 0, type: "unknown", message: "no attempt made" },
  );
}

function extractText(json: unknown): string {
  // Réponse Anthropic : { content: [{ type: 'text', text: '...' }, ...] }
  const content = (json as { content?: Array<{ type: string; text?: string }> })
    ?.content;
  if (!Array.isArray(content)) return "";
  const textBlock = content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

async function safeReadJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round4(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

/**
 * Parse robuste du JSON renvoyé par Claude. Gère le cas où le modèle entoure
 * (à tort) sa réponse de ```json ... ```.
 */
export function parseClaudeJson(text: string): unknown {
  const trimmed = text.trim();

  // Cas idéal : JSON pur
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed);
  }

  // Cas dégradé : ```json ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    return JSON.parse(fenced[1]);
  }

  // Cas dégradé : on isole le premier objet { ... } trouvé
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("No JSON object found in Claude response");
}
