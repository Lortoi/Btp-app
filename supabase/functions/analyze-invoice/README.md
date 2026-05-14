# `analyze-invoice` — Edge Function

Reçoit un PDF de facture BTP française, l'envoie à Claude Sonnet 4.5 pour
extraction structurée, l'upload dans le bucket Storage `factures-pdf` et
insère une ligne dans `public.factures`.

## Contrat HTTP

### Request

```http
POST /functions/v1/analyze-invoice
Authorization: Bearer <USER_JWT>
Content-Type: application/json
```

```json
{
  "import_id": "uuid",
  "pdf_base64": "JVBERi0xLjcK...",
  "filename": "facture_2024_001.pdf"
}
```

### Response (success — 200)

```json
{
  "ok": true,
  "facture_id": "uuid",
  "extraction": { /* ExtractedInvoiceSchema */ },
  "pdf_path": "<user_id>/<import_id>/<facture_id>.pdf",
  "api_cost_eur": 0.0214,
  "api_model": "claude-sonnet-4-6",
  "duration_ms": 7321
}
```

### Response (error — 400/401/403/404/500/502)

```json
{
  "ok": false,
  "error": "Description lisible",
  "facture_id": "uuid|null",
  "duration_ms": 7321
}
```

Si `facture_id` est non-null en cas d'erreur, ça veut dire que la ligne en base
existe avec `status = 'error'` et `error_message` rempli. L'utilisateur peut
retenter une analyse depuis l'UI sans recréer la ligne.

---

## Configuration requise

### 1. Secrets Edge Function

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...
```

`SUPABASE_URL` et `SUPABASE_ANON_KEY` sont automatiquement disponibles dans
le runtime Edge Function — pas besoin de les setter.

### 2. Zero Data Retention Anthropic

**Avant la mise en prod, activer le ZDR** sur le compte Anthropic
(plans Business / Enterprise). Sans ZDR, Anthropic conserve les
inputs/outputs 30 jours, ce qui n'est pas conforme RGPD pour des factures
clients.

Doc : <https://docs.claude.com/en/docs/legal-and-compliance/data-usage>

### 3. Migration SQL appliquée

Cette fonction présuppose que la migration
`supabase/migrations/20260514120000_import_feature.sql` est passée
(tables `imports`, `factures`, bucket `factures-pdf`, RLS).

---

## Déploiement

### Option A — Supabase CLI (recommandé)

```bash
supabase link --project-ref hvnjlxxcxfxvuwlmnwtw
supabase functions deploy analyze-invoice
```

### Option B — Dashboard Supabase

1. Supabase Dashboard → Edge Functions → Create function → name = `analyze-invoice`.
2. Copier le contenu de `index.ts`, `prompt.ts`, `schema.ts`, `anthropic.ts` et
   `_shared/cors.ts` dans l'éditeur web.
3. Set secret `ANTHROPIC_API_KEY` dans Settings → Edge Functions.
4. Deploy.

---

## Test local

### Avec CLI

```bash
# 1. Démarrer Supabase localement
supabase start

# 2. Démarrer la fonction en local (port 54321 par défaut)
supabase functions serve analyze-invoice --env-file ./.env.local

# 3. Test avec curl (depuis un autre terminal)
PDF_B64=$(base64 -i ./test-fixtures/facture.pdf)
JWT=$(supabase auth login | grep "access_token")  # ou récupérer manuellement

curl -X POST http://localhost:54321/functions/v1/analyze-invoice \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"import_id\": \"00000000-0000-0000-0000-000000000001\",
    \"pdf_base64\": \"$PDF_B64\",
    \"filename\": \"facture.pdf\"
  }"
```

### Sans CLI (test direct contre le déploiement)

```bash
curl -X POST https://hvnjlxxcxfxvuwlmnwtw.supabase.co/functions/v1/analyze-invoice \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d @./test-payload.json
```

Pour récupérer un JWT côté navigateur :
```js
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);
```

---

## Coût estimé par appel

Pour une facture BTP typique d'1 page :
- Input : ~3000 tokens (PDF + prompt système)
- Output : ~800 tokens (JSON)
- Coût USD : (3000 × $3 + 800 × $15) / 1M ≈ $0.021
- Coût EUR : ~0.020 € (taux 0.92)

Pour 200 factures : ~4 € côté Anthropic. À cumuler avec les invocations
Edge Function (gratuites jusqu'à 500K/mois sur le plan free).

---

## Limites connues

- **Timeout 60s côté Edge Function** : on appelle Claude avec un timeout de
  55s. Pour les PDF très denses (> 10 pages), à monter sur plan payant ou
  utiliser un worker dédié.
- **Tarif EUR codé en dur** (`USD_TO_EUR = 0.92` dans `anthropic.ts`). À
  ajuster si le taux dévie significativement.
- **Pas de cache** : si on rejoue 2× le même PDF, on paie 2× Claude.
  Acceptable pour l'usage import one-shot. Si on veut éviter, ajouter un
  hash SHA-256 du PDF et un check `select` avant l'appel.
- **Modèle hardcodé** dans `anthropic.ts` (`MODEL = 'claude-sonnet-4-6'`,
  alias dateless de Sonnet 4.6, modèle courant en mai 2026). Vérifier sur
  <https://docs.claude.com/en/docs/about-claude/models/overview> au moment
  du déploiement. Pour épingler à une date précise (reproductibilité),
  passer à `claude-sonnet-4-5-20250929` (dernière version datée de 4.5).
