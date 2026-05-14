// =============================================================================
// Edge Function : analyze-invoice
// -----------------------------------------------------------------------------
// Reçoit un PDF de facture, l'envoie à Claude pour extraction structurée,
// upload le PDF dans le bucket `factures-pdf`, et insère une ligne en base
// dans la table `factures` (status = 'extracted' ou 'error').
//
// Sécurité :
//   - L'appelant DOIT envoyer un JWT Supabase valide (header Authorization).
//   - RLS sur `factures` + `imports` empêche d'écrire pour un autre user.
//   - La clé Anthropic est lue depuis les secrets Edge Function, jamais
//     exposée au client.
//
// Déploiement : voir README.md du dossier.
// =============================================================================

import { createClient } from "npm:@supabase/supabase-js@2.84.0";
import { corsHeaders } from "../_shared/cors.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import {
  ExtractedInvoiceSchema,
  RequestSchema,
  type ResponseError,
  type ResponseSuccess,
} from "./schema.ts";
import {
  AnthropicCallError,
  callClaudeWithPdf,
  MODEL,
  parseClaudeJson,
} from "./anthropic.ts";

Deno.serve(async (req) => {
  const t0 = Date.now();

  // ---------------------------------------------------------------- CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed", facture_id: null, duration_ms: 0 }, 405);
  }

  // ---------------------------------------------------------- Parse body
  let payload;
  try {
    const raw = await req.json();
    payload = RequestSchema.parse(raw);
  } catch (err) {
    return json(
      {
        ok: false,
        error: `Invalid request payload: ${(err as Error).message}`,
        facture_id: null,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      400,
    );
  }

  // -------------------------------------------------------- Env / Secrets
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !anthropicKey) {
    return json(
      {
        ok: false,
        error: "Server misconfigured: missing required secrets",
        facture_id: null,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      500,
    );
  }

  // -------------------------------------------- Supabase client (user JWT)
  // On instancie un client AVEC le JWT du caller. Toutes les opérations DB et
  // Storage respecteront donc les policies RLS de cet utilisateur.
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // -------------------------------------------------- Verify auth + import
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return json(
      {
        ok: false,
        error: "Unauthorized: invalid or missing JWT",
        facture_id: null,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      401,
    );
  }
  const userId = userData.user.id;

  // Verify the import row exists and belongs to the caller. RLS makes this
  // implicit, but a friendly 404 helps debugging.
  const { data: importRow, error: importErr } = await supabase
    .from("imports")
    .select("id, user_id, status")
    .eq("id", payload.import_id)
    .single();
  if (importErr || !importRow) {
    return json(
      {
        ok: false,
        error: "Import not found or not yours",
        facture_id: null,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      404,
    );
  }
  if (importRow.user_id !== userId) {
    // Defense in depth — RLS should have caught this already.
    return json(
      {
        ok: false,
        error: "Import does not belong to the authenticated user",
        facture_id: null,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      403,
    );
  }

  // ---------------------------------------------- Pre-allocate facture row
  // On crée la ligne facture AVANT l'appel Claude, pour pouvoir tracer même
  // si Claude échoue. status='extracting' n'est pas dans l'enum, donc on
  // utilise 'error' par défaut puis on bascule vers 'extracted' à la fin.
  const { data: factureInserted, error: factureInsertErr } = await supabase
    .from("factures")
    .insert({
      user_id: userId,
      import_id: payload.import_id,
      status: "error", // sera mis à 'extracted' si tout OK
      pdf_filename: payload.filename,
      api_model: MODEL,
      error_message: "Analysis not yet started",
    })
    .select("id")
    .single();
  if (factureInsertErr || !factureInserted) {
    return json(
      {
        ok: false,
        error: `Failed to create facture row: ${factureInsertErr?.message ?? "unknown"}`,
        facture_id: null,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      500,
    );
  }
  const factureId = factureInserted.id as string;

  // -------------------------------------------------------- Upload PDF
  // Convention de chemin : <user_id>/<import_id>/<facture_id>.pdf
  // Cohérent avec la policy storage qui check (storage.foldername(name))[1].
  const pdfPath = `${userId}/${payload.import_id}/${factureId}.pdf`;
  const pdfBytes = base64ToBytes(payload.pdf_base64);
  const { error: uploadErr } = await supabase.storage
    .from("factures-pdf")
    .upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadErr) {
    await supabase
      .from("factures")
      .update({
        error_message: `PDF upload failed: ${uploadErr.message}`,
      })
      .eq("id", factureId);
    return json(
      {
        ok: false,
        error: `PDF upload failed: ${uploadErr.message}`,
        facture_id: factureId,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      500,
    );
  }

  // ----------------------------------------------- Appel Claude (extract)
  let claudeResult;
  try {
    claudeResult = await callClaudeWithPdf({
      apiKey: anthropicKey,
      systemPrompt: SYSTEM_PROMPT,
      pdfBase64: payload.pdf_base64,
    });
  } catch (err) {
    const msg =
      err instanceof AnthropicCallError
        ? `Anthropic ${err.status} ${err.type}: ${err.message}`
        : `Claude call failed: ${(err as Error).message}`;
    await supabase
      .from("factures")
      .update({ error_message: msg, pdf_url: pdfPath })
      .eq("id", factureId);
    return json(
      {
        ok: false,
        error: msg,
        facture_id: factureId,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      502,
    );
  }

  // ------------------------------------------ Parse + validate JSON output
  let extracted;
  try {
    const parsed = parseClaudeJson(claudeResult.text);
    extracted = ExtractedInvoiceSchema.parse(parsed);
  } catch (err) {
    const msg = `Invalid extraction JSON: ${(err as Error).message}`;
    await supabase
      .from("factures")
      .update({
        error_message: msg,
        pdf_url: pdfPath,
        api_cost_eur: claudeResult.costEur,
        raw_extraction: { __unparsed: claudeResult.text },
      })
      .eq("id", factureId);
    return json(
      {
        ok: false,
        error: msg,
        facture_id: factureId,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      502,
    );
  }

  // -------------------------------------------------- Update facture row
  // Note : on remplit les champs principaux pour la liste/validation, et on
  // conserve l'extraction complète dans raw_extraction pour ré-import éventuel.
  const { error: updateErr } = await supabase
    .from("factures")
    .update({
      status: "extracted",
      pdf_url: pdfPath,
      raw_extraction: extracted,
      confidence_score: extracted.confidence,
      champs_incertains: extracted.champs_incertains,
      numero: extracted.facture.numero,
      date_emission: extracted.facture.date_emission,
      date_prestation: extracted.facture.date_prestation,
      montant_ht: extracted.facture.montant_ht,
      montant_tva: extracted.facture.montant_tva,
      montant_ttc: extracted.facture.montant_ttc,
      api_cost_eur: claudeResult.costEur,
      api_model: claudeResult.model,
      error_message: null,
    })
    .eq("id", factureId);
  if (updateErr) {
    return json(
      {
        ok: false,
        error: `Failed to update facture: ${updateErr.message}`,
        facture_id: factureId,
        duration_ms: Date.now() - t0,
      } satisfies ResponseError,
      500,
    );
  }

  // ---------------------------------------- Cumule le coût sur l'import
  // On incrémente atomiquement via RPC pour éviter les races concurrentes.
  // (Si la RPC n'existe pas encore, on fait un read/update best-effort.)
  await incrementImportCost(supabase, payload.import_id, claudeResult.costEur);

  // -------------------------------------------------------- Success
  return json(
    {
      ok: true,
      facture_id: factureId,
      extraction: extracted,
      pdf_path: pdfPath,
      api_cost_eur: claudeResult.costEur,
      api_model: claudeResult.model,
      duration_ms: Date.now() - t0,
    } satisfies ResponseSuccess,
    200,
  );
});

// ---------------------------------------------------------------- helpers

function json(body: ResponseSuccess | ResponseError, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function base64ToBytes(b64: string): Uint8Array {
  // Strip optional data URL prefix
  const clean = b64.replace(/^data:application\/pdf;base64,/, "");
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Incrémente best-effort `imports.cost_eur` et `imports.total_processed`.
 * On utilise un read/update — il y a un risque théorique de race si plusieurs
 * factures terminent en parallèle. Pour 3 appels concurrents max (limite
 * client-side), c'est acceptable. Pour un volume plus large, créer une RPC SQL
 * avec verrouillage.
 */
async function incrementImportCost(
  supabase: ReturnType<typeof createClient>,
  importId: string,
  costDelta: number,
): Promise<void> {
  const { data, error } = await supabase
    .from("imports")
    .select("cost_eur, total_processed")
    .eq("id", importId)
    .single();
  if (error || !data) return;
  await supabase
    .from("imports")
    .update({
      cost_eur: Number(data.cost_eur ?? 0) + costDelta,
      total_processed: Number(data.total_processed ?? 0) + 1,
    })
    .eq("id", importId);
}
