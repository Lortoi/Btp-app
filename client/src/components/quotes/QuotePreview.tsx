import type { QuoteDraft, QuoteTotals } from "./quoteTypes"
import { isSociete, uniteLabel } from "./quoteTypes"

interface QuotePreviewProps {
  draft: QuoteDraft
  totals: QuoteTotals
}

export function QuotePreview({ draft, totals }: QuotePreviewProps) {
  const totalMap = new Map(totals.ligneTotals.map((x) => [x.id, x.totalHT]))

  return (
    <div className="rounded-2xl border border-gray-300 dark:border-gray-600 bg-black/25 backdrop-blur-xl shadow-2xl overflow-hidden text-sm text-gray-900 dark:text-white ring-1 ring-white/5">
      {/* En-tête entreprise — même langage que les cartes dashboard */}
      <div className="relative px-6 py-5 flex gap-6 items-start border-b border-gray-300 dark:border-gray-600">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/35 via-transparent to-[hsl(250_75%_45%)]/15"
          aria-hidden
        />
        <div className="relative shrink-0 w-24 h-24 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600 shadow-inner">
          {draft.company.logoBase64 ? (
            <img
              src={draft.company.logoBase64}
              alt="Logo"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-1">Logo</span>
          )}
        </div>
        <div className="relative flex-1 min-w-0 space-y-1">
          <div className="font-bold text-lg leading-tight text-gray-900 dark:text-white tracking-tight">
            {draft.company.raisonSociale || "Raison sociale"}
          </div>
          <div className="text-white/75 whitespace-pre-line text-xs leading-relaxed">
            {draft.company.adresse || "Adresse"}
          </div>
          {draft.company.siret && (
            <div className="text-xs text-gray-500 dark:text-gray-400">SIRET : {draft.company.siret}</div>
          )}
          {draft.company.tvaIntra && (
            <div className="text-xs text-gray-500 dark:text-gray-400">TVA : {draft.company.tvaIntra}</div>
          )}
          {isSociete(draft.company.formeJuridique) && draft.company.capitalSocial && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Capital social : {draft.company.capitalSocial}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 bg-gradient-to-b from-black/20 to-black/35">
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold tracking-[0.2em] text-[hsl(var(--ring))] drop-shadow-sm">
            DEVIS
          </div>
          <div className="text-gray-900 dark:text-white">
            N° <span className="font-semibold text-white">{draft.devis.numero || "—"}</span>
            {" · "}
            Date :{" "}
            <span className="font-semibold text-white">
              {formatFrDate(draft.devis.dateEmission)}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Validité : {draft.devis.validiteJours} jours
          </div>
        </div>

        <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-black/25 backdrop-blur-sm p-4 shadow-inner">
          <div className="text-xs font-semibold text-[hsl(var(--ring))] uppercase tracking-wider mb-2">
            Client
          </div>
          <div className="font-semibold text-white">{draft.client.nom || "—"}</div>
          <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line mt-1 text-sm">
            {draft.client.adresse || "—"}
          </div>
          {(draft.client.email || draft.client.phone) && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-0.5 border-t border-gray-200 dark:border-gray-600 pt-2">
              {draft.client.email && <div>Email : {draft.client.email}</div>}
              {draft.client.phone && <div>Tél. : {draft.client.phone}</div>}
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-600 bg-black/20">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-primary/90 text-primary-foreground border-b border-gray-300 dark:border-gray-600">
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-right p-3 font-semibold w-14">Qté</th>
                <th className="text-center p-3 font-semibold w-16">Unité</th>
                <th className="text-right p-3 font-semibold w-24">PU HT</th>
                <th className="text-right p-3 font-semibold w-24">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {draft.lignes.map((l, i) => (
                <tr
                  key={l.id}
                  className={
                    i % 2 === 0
                      ? "bg-white/[0.04] border-b border-white/5"
                      : "bg-white/[0.07] border-b border-white/5"
                  }
                >
                  <td className="p-3 align-top text-gray-900 dark:text-white">{l.description || "—"}</td>
                  <td className="p-3 text-right text-gray-600 dark:text-gray-300">{l.quantity}</td>
                  <td className="p-3 text-center text-gray-600 dark:text-gray-300">{uniteLabel(l.unite)}</td>
                  <td className="p-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                    {l.puHT.toFixed(2)} €
                  </td>
                  <td className="p-3 text-right font-medium tabular-nums text-white">
                    {(totalMap.get(l.id) ?? 0).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-black/30 p-4 backdrop-blur-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">Total HT</span>
              <span className="font-medium tabular-nums text-white">{totals.totalHT.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 dark:text-gray-400">TVA ({totals.tvaLabel})</span>
              <span className="font-medium tabular-nums text-white">
                {totals.montantTVA.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-3 border-t border-[hsl(var(--ring))]/40 text-base">
              <span className="font-bold text-[hsl(var(--ring))]">Total TTC</span>
              <span className="font-bold text-lg tabular-nums text-[hsl(var(--ring))]">
                {totals.totalTTC.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-black/20 p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold text-[hsl(var(--ring))] uppercase tracking-wider mb-2">
            Assurance décennale
          </div>
          <div className="text-xs text-white/75 space-y-1">
            <div>
              <span className="text-white/45">Assureur : </span>
              {draft.company.decennale.assureur || "—"}
            </div>
            <div>
              <span className="text-white/45">N° contrat : </span>
              {draft.company.decennale.contrat || "—"}
            </div>
            <div>
              <span className="text-white/45">Zone couverte : </span>
              {draft.company.decennale.zone || "—"}
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs text-white/75">
          <div>
            <span className="font-semibold text-[hsl(var(--ring))]">Modalités de paiement</span>
            <div className="mt-1 whitespace-pre-line leading-relaxed">
              {draft.financier.modalitesPaiement || "—"}
            </div>
          </div>
          <div>
            <span className="font-semibold text-[hsl(var(--ring))]">Pénalités de retard</span>
            <div className="mt-1 whitespace-pre-line leading-relaxed">
              {draft.financier.penalitesRetard || "—"}
            </div>
          </div>
        </div>

        {draft.notes.trim() && (
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-black/25 p-4 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line backdrop-blur-sm">
            <div className="font-semibold text-[hsl(var(--ring))] mb-1">Notes</div>
            {draft.notes}
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-600 text-xs text-white/45">
          Bon pour accord — Date : ___ — Signature : ___
        </div>
      </div>
    </div>
  )
}

function formatFrDate(iso: string): string {
  if (!iso) return "—"
  const [y, m, day] = iso.split("-").map(Number)
  if (!y || !m || !day) return iso
  return new Date(y, m - 1, day).toLocaleDateString("fr-FR")
}
