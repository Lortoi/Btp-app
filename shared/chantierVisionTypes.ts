export type ChantierWorkType =
  | "renovation-cuisine"
  | "renovation-sdb"
  | "ravalement"
  | "carrelage"
  | "peinture"
  | "autre"

export type ChantierVisionLigne = {
  description: string
  quantity: number
  unite: "m2" | "ml" | "h" | "forfait" | "u"
  puHT: number
}

export type ChantierVisionReport = {
  description_rendu: string
  travaux_necessaires: string[]
  estimation_temps: string
  recommandations_materiaux: string[]
  lignes_devis: ChantierVisionLigne[]
}

export const CHANTIER_WORK_TYPES: {
  id: ChantierWorkType
  label: string
  icon: string
}[] = [
  { id: "renovation-cuisine", label: "Rénovation cuisine", icon: "🍳" },
  { id: "renovation-sdb", label: "Rénovation salle de bain", icon: "🚿" },
  { id: "ravalement", label: "Ravalement façade", icon: "🏠" },
  { id: "carrelage", label: "Pose carrelage", icon: "🧱" },
  { id: "peinture", label: "Peinture intérieure", icon: "🎨" },
  { id: "autre", label: "Autre", icon: "✏️" },
]

export function workTypeLabel(id: ChantierWorkType, custom?: string): string {
  if (id === "autre") return custom?.trim() || "Autre"
  return CHANTIER_WORK_TYPES.find((t) => t.id === id)?.label ?? id
}
