export const QUOTE_STORAGE_KEY = "planchais.quoteDraft.v1"
export const QUOTE_SEQ_KEY = "planchais.quoteSeq.v1"
export const SAVED_QUOTES_KEY = "planchais.quotes.v1"
export const SAVED_QUOTES_SELECTED_ID_KEY = "planchais.quotes.selectedId"

export type FormeJuridique =
  | "auto-entrepreneur"
  | "EURL"
  | "SASU"
  | "SAS"
  | "SARL"
  | "SA"

export type UnitePrestation = "m2" | "ml" | "h" | "forfait" | "u"

export type TvaMode = "20" | "10" | "5.5" | "0" | "293B"

export interface LignePrestation {
  id: string
  description: string
  quantity: number
  unite: UnitePrestation
  puHT: number
}

export interface QuoteDraft {
  company: {
    logoBase64: string | null
    raisonSociale: string
    formeJuridique: FormeJuridique
    adresse: string
    siret: string
    tvaIntra: string
    capitalSocial: string
    decennale: {
      assureur: string
      contrat: string
      zone: string
    }
  }
  devis: {
    numero: string
    dateEmission: string
    validiteJours: number
  }
  client: {
    nom: string
    adresse: string
    email: string
    phone: string
  }
  lignes: LignePrestation[]
  financier: {
    tvaMode: TvaMode
    modalitesPaiement: string
    penalitesRetard: string
  }
  notes: string
}

export interface SavedQuote {
  id: string
  numero: string
  clientNom: string
  createdAt: string
  draft: QuoteDraft
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function isSociete(forme: FormeJuridique): boolean {
  return forme !== "auto-entrepreneur"
}

export function nextQuoteNumber(): string {
  const d = new Date()
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`
  try {
    const raw = localStorage.getItem(QUOTE_SEQ_KEY)
    const data: Record<string, number> = raw ? JSON.parse(raw) : {}
    const next = (data[ym] ?? 0) + 1
    data[ym] = next
    localStorage.setItem(QUOTE_SEQ_KEY, JSON.stringify(data))
    return `DEV-${ym}-${String(next).padStart(3, "0")}`
  } catch {
    return `DEV-${ym}-001`
  }
}

export function createDefaultDraft(): QuoteDraft {
  const today = new Date().toISOString().slice(0, 10)
  return {
    company: {
      logoBase64: null,
      raisonSociale: "",
      formeJuridique: "auto-entrepreneur",
      adresse: "",
      siret: "",
      tvaIntra: "",
      capitalSocial: "",
      decennale: { assureur: "", contrat: "", zone: "" },
    },
    devis: {
      numero: nextQuoteNumber(),
      dateEmission: today,
      validiteJours: 30,
    },
    client: { nom: "", adresse: "", email: "", phone: "" },
    lignes: [
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unite: "u",
        puHT: 0,
      },
    ],
    financier: {
      tvaMode: "20",
      modalitesPaiement: "",
      penalitesRetard: "Taux légal en vigueur",
    },
    notes: "",
  }
}

export function uniteLabel(u: UnitePrestation): string {
  const map: Record<UnitePrestation, string> = {
    m2: "m²",
    ml: "ml",
    h: "h",
    forfait: "forfait",
    u: "u",
  }
  return map[u]
}

export interface QuoteTotals {
  ligneTotals: { id: string; totalHT: number }[]
  totalHT: number
  montantTVA: number
  totalTTC: number
  tvaLabel: string
}

export function computeTotals(draft: QuoteDraft): QuoteTotals {
  const ligneTotals = draft.lignes.map((l) => ({
    id: l.id,
    totalHT: round2(l.quantity * l.puHT),
  }))
  const totalHT = round2(ligneTotals.reduce((s, x) => s + x.totalHT, 0))

  let rate = 0
  let tvaLabel = ""
  switch (draft.financier.tvaMode) {
    case "20":
      rate = 0.2
      tvaLabel = "20 %"
      break
    case "10":
      rate = 0.1
      tvaLabel = "10 %"
      break
    case "5.5":
      rate = 0.055
      tvaLabel = "5,5 %"
      break
    case "0":
      rate = 0
      tvaLabel = "0 %"
      break
    case "293B":
      rate = 0
      tvaLabel = "Non applicable — art. 293 B CGI"
      break
  }

  const montantTVA = round2(totalHT * rate)
  const totalTTC = round2(totalHT + montantTVA)

  return { ligneTotals, totalHT, montantTVA, totalTTC, tvaLabel }
}

export function sanitizeFilenamePart(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80) || "Client"
}
