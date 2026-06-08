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
      raisonSociale: "Dupont Rénovation",
      formeJuridique: "auto-entrepreneur",
      adresse: "12 rue des Artisans, 92100 Boulogne-Billancourt",
      siret: "123 456 789 00012",
      tvaIntra: "",
      capitalSocial: "",
      decennale: {
        assureur: "AXA France",
        contrat: "DEC-2024-88421",
        zone: "Île-de-France",
      },
    },
    devis: {
      numero: nextQuoteNumber(),
      dateEmission: today,
      validiteJours: 30,
    },
    client: {
      nom: "Sophie Bernard",
      adresse: "45 rue Anatole France, 92300 Levallois-Perret",
      email: "sophie.bernard@gmail.com",
      phone: "06 14 25 36 47",
    },
    lignes: [
      {
        id: crypto.randomUUID(),
        description: "Démolition, préparation des supports et étanchéité douche à l'italienne",
        quantity: 1,
        unite: "forfait",
        puHT: 4200,
      },
      {
        id: crypto.randomUUID(),
        description: "Pose carrelage grès cérame au sol et murs (fourniture comprise)",
        quantity: 18,
        unite: "m2",
        puHT: 95,
      },
      {
        id: crypto.randomUUID(),
        description: "Plomberie sanitaire complète (vasque, douche, robinetterie)",
        quantity: 1,
        unite: "forfait",
        puHT: 3800,
      },
      {
        id: crypto.randomUUID(),
        description: "Électricité et ventilation mécanique contrôlée (VMC)",
        quantity: 1,
        unite: "forfait",
        puHT: 2100,
      },
    ],
    financier: {
      tvaMode: "20",
      modalitesPaiement: "30 % à la commande, 40 % en cours de chantier, solde à réception",
      penalitesRetard: "Taux légal en vigueur",
    },
    notes: "Chantier : rénovation salle de bain — Levallois-Perret. Délai indicatif : 12 jours ouvrés.",
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
