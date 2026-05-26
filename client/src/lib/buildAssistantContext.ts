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
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function quoteTotalHT(quote: SavedQuote): number {
  return round2(
    quote.draft.lignes.reduce((sum, l) => sum + l.quantity * l.puHT, 0)
  )
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
    numero: q.numero,
    client: q.clientNom,
    date: q.createdAt,
    montantHT: quoteTotalHT(q),
    nbLignes: q.draft.lignes.length,
  }))

  const factures = invoices.map((item) => ({
    fichier: item.filename,
    numero: item.extraction.facture?.numero ?? null,
    client: item.extraction.client?.nom ?? "Client non identifié",
    dateEmission: item.extraction.facture?.date_emission ?? null,
    montantTTC: item.extraction.facture?.montant_ttc ?? null,
    montantHT: item.extraction.facture?.montant_ht ?? null,
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
      nom: c.name,
      email: c.email,
      telephone: c.phone,
    })),
    chantiers: chantiers.map((c) => ({
      nom: c.nom,
      client: c.clientName,
      statut: c.statut,
      dateDebut: c.dateDebut,
      duree: c.duree,
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
  return JSON.stringify(buildAssistantContext(clients, chantiers), null, 2)
}
