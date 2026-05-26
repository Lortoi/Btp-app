import type { Client, Chantier } from "@/context/ChantiersContext"
import { SAVED_QUOTES_KEY, round2, type SavedQuote } from "@/components/quotes/quoteTypes"
import { loadStoredImports } from "@/lib/invoiceImportStorage"

export type AssistantContextPayload = {
  generatedAt: string
  periode: { mois: string; annee: number }
  clients: Array<{ nom: string; email: string; telephone: string }>
  chantiers: Array<{
    nom: string
    client: string
    statut: string
    dateDebut: string
    duree: string
  }>
  devis: Array<{
    numero: string
    client: string
    date: string
    montantHT: number
    nbLignes: number
  }>
  factures: Array<{
    fichier: string
    numero: string | null
    client: string
    dateEmission: string | null
    montantTTC: number | null
    montantHT: number | null
  }>
  indicateurs: {
    nbClients: number
    nbChantiersEnCours: number
    nbDevis: number
    nbFactures: number
    caFacturesMoisTTC: number
    caDevisMoisHT: number
    totalDevisHT: number
    totalFacturesTTC: number
  }
  notes: string[]
}

function loadSavedQuotes(): SavedQuote[] {
  try {
    const raw = localStorage.getItem(SAVED_QUOTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedQuote[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (q) =>
        q &&
        typeof q === "object" &&
        typeof q.numero === "string" &&
        q.draft &&
        Array.isArray(q.draft.lignes)
    )
  } catch {
    return []
  }
}

function sanitizeText(value: unknown, maxLen = 300): string {
  if (value == null) return ""
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .trim()
    .slice(0, maxLen)
}

function safeNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function quoteTotalHT(quote: SavedQuote): number {
  try {
    return round2(
      quote.draft.lignes.reduce(
        (sum, l) => sum + safeNumber(l.quantity) * safeNumber(l.puHT),
        0
      )
    )
  } catch {
    return 0
  }
}

function isSameMonth(dateStr: string | null | undefined, ref: Date): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
}

export function buildAssistantContext(
  clients: Client[],
  chantiers: Chantier[]
): AssistantContextPayload {
  const now = new Date()
  const quotes = loadSavedQuotes()
  const invoices = loadStoredImports()

  const devis = quotes.map((q) => ({
    numero: sanitizeText(q.numero, 80),
    client: sanitizeText(q.clientNom, 120),
    date: sanitizeText(q.createdAt, 40),
    montantHT: quoteTotalHT(q),
    nbLignes: q.draft.lignes.length,
  }))

  const factures = invoices.map((item) => ({
    fichier: sanitizeText(item.filename, 200),
    numero: item.extraction.facture?.numero
      ? sanitizeText(item.extraction.facture.numero, 80)
      : null,
    client: sanitizeText(item.extraction.client?.nom ?? "Client non identifié", 120),
    dateEmission: item.extraction.facture?.date_emission
      ? sanitizeText(item.extraction.facture.date_emission, 40)
      : null,
    montantTTC: safeNumber(item.extraction.facture?.montant_ttc) || null,
    montantHT: safeNumber(item.extraction.facture?.montant_ht) || null,
  }))

  const totalDevisHT = round2(devis.reduce((s, d) => s + d.montantHT, 0))
  const totalFacturesTTC = round2(
    factures.reduce((s, f) => s + (f.montantTTC ?? 0), 0)
  )
  const caFacturesMoisTTC = round2(
    factures
      .filter((f) => isSameMonth(f.dateEmission, now))
      .reduce((s, f) => s + (f.montantTTC ?? 0), 0)
  )
  const caDevisMoisHT = round2(
    devis.filter((d) => isSameMonth(d.date, now)).reduce((s, d) => s + d.montantHT, 0)
  )

  const chantiersEnCours = chantiers.filter((c) => c.statut === "en cours")

  return {
    generatedAt: now.toISOString(),
    periode: {
      mois: now.toLocaleString("fr-FR", { month: "long" }),
      annee: now.getFullYear(),
    },
    clients: clients.map((c) => ({
      nom: sanitizeText(c.name, 120),
      email: sanitizeText(c.email, 120),
      telephone: sanitizeText(c.phone, 40),
    })),
    chantiers: chantiers.map((c) => ({
      nom: sanitizeText(c.nom, 120),
      client: sanitizeText(c.clientName, 120),
      statut: sanitizeText(c.statut, 40),
      dateDebut: sanitizeText(c.dateDebut, 40),
      duree: sanitizeText(c.duree, 40),
    })),
    devis,
    factures,
    indicateurs: {
      nbClients: clients.length,
      nbChantiersEnCours: chantiersEnCours.length,
      nbDevis: devis.length,
      nbFactures: factures.length,
      caFacturesMoisTTC,
      caDevisMoisHT,
      totalDevisHT,
      totalFacturesTTC,
    },
    notes: [
      "Les factures proviennent des PDF importés via Import factures.",
      "Le suivi des paiements (encaissé / impayé) n'est pas encore automatisé : les factures listées sont des extractions, pas des statuts de paiement.",
      "Le planning affiche aussi des chantiers mock sur la page Planning si peu de chantiers réels existent.",
    ],
  }
}

export function serializeAssistantContext(
  clients: Client[],
  chantiers: Chantier[]
): string {
  try {
    const payload = buildAssistantContext(clients, chantiers)
    return JSON.stringify(payload)
  } catch {
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      clients: [],
      chantiers: [],
      devis: [],
      factures: [],
      indicateurs: {},
      notes: ["Erreur lors de la lecture des données locales."],
    })
  }
}
