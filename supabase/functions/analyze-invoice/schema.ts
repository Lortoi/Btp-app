// Zod schemas for the Edge Function `analyze-invoice`.
// Single source of truth for the shape returned by Claude.
//
// IMPORTANT : Si tu modifies ce fichier, modifie aussi `prompt.ts` pour que
// le prompt reste en phase avec le schéma. Et inversement.

import { z } from "npm:zod@3.24.2";

// ---------------------------------------------------------------------------
// Request payload (browser → Edge Function)
// ---------------------------------------------------------------------------
export const RequestSchema = z.object({
  /** UUID de l'import parent (table `imports`). */
  import_id: z.string().uuid(),
  /** PDF encodé en base64 (sans préfixe data:application/pdf). */
  pdf_base64: z.string().min(100),
  /** Nom de fichier original, utilisé pour les logs et le storage. */
  filename: z.string().min(1).max(255),
});
export type RequestPayload = z.infer<typeof RequestSchema>;

// ---------------------------------------------------------------------------
// Extracted invoice (Claude → Edge Function → DB)
// ---------------------------------------------------------------------------
// Helpers : Claude peut renvoyer null OU une chaîne vide pour "absent".
// On normalise les deux vers `null`.
const nullableText = z
  .union([z.string(), z.null()])
  .transform((v) => (v === "" || v === null ? null : v));

const nullableNumber = z
  .union([z.number(), z.null()])
  .transform((v) => (v === null ? null : v));

// SIRET : 14 chiffres exacts après nettoyage des espaces. Sinon null.
const siretField = z
  .union([z.string(), z.null()])
  .transform((v) => {
    if (v === null || v === "") return null;
    const cleaned = v.replace(/\s+/g, "");
    return /^\d{14}$/.test(cleaned) ? cleaned : null;
  });

// Date ISO YYYY-MM-DD. Si Claude renvoie autre chose, on coerce ou on null.
const isoDateField = z
  .union([z.string(), z.null()])
  .transform((v) => {
    if (v === null || v === "") return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    return null;
  });

export const ClientBlockSchema = z.object({
  nom: nullableText,
  adresse: nullableText,
  code_postal: nullableText,
  ville: nullableText,
  telephone: nullableText,
  email: nullableText,
  siret: siretField,
  tva_intracom: nullableText,
});

export const ChantierBlockSchema = z.object({
  adresse: nullableText,
  code_postal: nullableText,
  ville: nullableText,
  description: nullableText,
});

export const FactureBlockSchema = z.object({
  numero: nullableText,
  date_emission: isoDateField,
  date_prestation: isoDateField,
  montant_ht: nullableNumber,
  montant_tva: nullableNumber,
  montant_ttc: nullableNumber,
});

export const LigneSchema = z.object({
  designation: z.string(),
  quantite: nullableNumber,
  prix_unitaire: nullableNumber,
  montant_ht: nullableNumber,
  tva_rate: nullableNumber,
});

export const ExtractedInvoiceSchema = z.object({
  client: ClientBlockSchema,
  chantier: ChantierBlockSchema,
  facture: FactureBlockSchema,
  lignes: z.array(LigneSchema).max(50),
  confidence: z.number().min(0).max(1),
  champs_incertains: z.array(z.string()).default([]),
  remarques: nullableText,
});

export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;

// ---------------------------------------------------------------------------
// Response (Edge Function → browser)
// ---------------------------------------------------------------------------
export const ResponseSuccessSchema = z.object({
  ok: z.literal(true),
  facture_id: z.string().uuid(),
  extraction: ExtractedInvoiceSchema,
  pdf_path: z.string(),
  api_cost_eur: z.number(),
  api_model: z.string(),
  duration_ms: z.number(),
});

export const ResponseErrorSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  facture_id: z.string().uuid().nullable(),
  duration_ms: z.number(),
});

export type ResponseSuccess = z.infer<typeof ResponseSuccessSchema>;
export type ResponseError = z.infer<typeof ResponseErrorSchema>;
