export type ExtractedInvoice = {
  client: {
    nom: string | null
    adresse: string | null
    code_postal: string | null
    ville: string | null
    telephone: string | null
    email: string | null
    siret: string | null
    tva_intracom: string | null
  }
  chantier: {
    adresse: string | null
    code_postal: string | null
    ville: string | null
    description: string | null
  }
  facture: {
    numero: string | null
    date_emission: string | null
    date_prestation: string | null
    montant_ht: number | null
    montant_tva: number | null
    montant_ttc: number | null
  }
  lignes: Array<{
    designation: string
    quantite: number | null
    prix_unitaire: number | null
    montant_ht: number | null
    tva_rate: number | null
  }>
  confidence: number
  champs_incertains: string[]
  remarques: string | null
}

export type StoredInvoiceImport = {
  id: string
  filename: string
  analyzedAt: string
  extraction: ExtractedInvoice
}
