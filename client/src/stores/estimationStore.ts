import { create } from "zustand"

export type EstimationStep = 1 | 2 | 3

export type TypeTravaux = "neuf" | "renovation" | "extension" | "demolition" | "second-oeuvre"
export type CorpsMetier =
  | "maconnerie"
  | "electricite"
  | "plomberie"
  | "carrelage"
  | "peinture"
  | "menuiserie"
  | "charpente"
  | "couverture"
  | "isolation"
  | "multi-corps"

export type TvaRate = 5.5 | 10 | 20

export interface EstimationPhoto {
  file: File
  previewUrl: string
}

export interface CostLine {
  poste:
    | "Main d'œuvre"
    | "Matériaux"
    | "Matériel"
    | "Sous-traitance"
    | "Frais de chantier"
    | "Provision aléas"
  quantite: number
  puHT: number
}

export interface EstimationResults {
  lignes: CostLine[]
  totalHT: number
  margePct: number
  margeAmount: number
  totalHTAvecMarge: number
  tvaRate: TvaRate
  tvaAmount: number
  totalTTC: number
}

export interface EstimationStore {
  // NE PAS ajouter persist middleware — File objects non sérialisables
  step: EstimationStep
  setStep: (s: EstimationStep) => void

  photos: EstimationPhoto[]
  addPhotos: (files: File[]) => void
  removePhoto: (index: number) => void
  clearPhotos: () => void

  clientMode: "existing" | "new"
  clientId: string | null
  newClientName: string
  newClientEmail: string
  newClientPhone: string
  setClientMode: (m: "existing" | "new") => void
  setClientId: (id: string | null) => void
  setNewClient: (p: Partial<Pick<EstimationStore, "newClientName" | "newClientEmail" | "newClientPhone">>) => void

  surfaceM2: string
  typeTravaux: TypeTravaux | ""
  corpsMetier: CorpsMetier | ""
  localisation: string
  dureeEstimee: string
  ouvriersEstimes: string
  notes: string
  setChantier: (
    p: Partial<
      Pick<
        EstimationStore,
        | "surfaceM2"
        | "typeTravaux"
        | "corpsMetier"
        | "localisation"
        | "dureeEstimee"
        | "ouvriersEstimes"
        | "notes"
      >
    >,
  ) => void

  materiauxTags: string[]
  addMateriauTag: (tag: string) => void
  removeMateriauTag: (tag: string) => void
  clearMateriauTags: () => void

  tvaRate: TvaRate
  margePct: number
  aleasPct: number
  setFinancier: (p: Partial<Pick<EstimationStore, "tvaRate" | "margePct" | "aleasPct">>) => void

  results: EstimationResults | null
  setResults: (r: EstimationResults | null) => void

  resetAll: () => void
}

const initialState = {
  step: 1 as EstimationStep,
  photos: [] as EstimationPhoto[],
  clientMode: "existing" as const,
  clientId: null as string | null,
  newClientName: "",
  newClientEmail: "",
  newClientPhone: "",
  surfaceM2: "",
  typeTravaux: "" as TypeTravaux | "",
  corpsMetier: "" as CorpsMetier | "",
  localisation: "",
  dureeEstimee: "",
  ouvriersEstimes: "",
  notes: "",
  materiauxTags: [] as string[],
  tvaRate: 20 as TvaRate,
  margePct: 12,
  aleasPct: 5,
  results: null as EstimationResults | null,
}

export const useEstimationStore = create<EstimationStore>((set, get) => ({
  ...initialState,

  setStep: (s) => set({ step: s }),

  addPhotos: (files) => {
    const existing = get().photos
    const capacity = Math.max(0, 10 - existing.length)
    if (capacity === 0) return
    const accepted = files.filter((f) => f.type.startsWith("image/")).slice(0, capacity)
    const next = accepted.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    set({ photos: [...existing, ...next] })
  },

  removePhoto: (index) => {
    const photos = get().photos
    const target = photos[index]
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
    set({ photos: photos.filter((_, i) => i !== index) })
  },

  clearPhotos: () => {
    const photos = get().photos
    for (const p of photos) {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
    }
    set({ photos: [] })
  },

  setClientMode: (m) => set({ clientMode: m }),
  setClientId: (id) => set({ clientId: id }),
  setNewClient: (p) => set(p as any),

  setChantier: (p) => set(p as any),

  addMateriauTag: (tag) => {
    const t = tag.trim()
    if (!t) return
    const cur = get().materiauxTags
    if (cur.some((x) => x.toLowerCase() === t.toLowerCase())) return
    set({ materiauxTags: [...cur, t] })
  },
  removeMateriauTag: (tag) =>
    set({ materiauxTags: get().materiauxTags.filter((t) => t !== tag) }),
  clearMateriauTags: () => set({ materiauxTags: [] }),

  setFinancier: (p) => set(p as any),

  setResults: (r) => set({ results: r }),

  resetAll: () => {
    get().clearPhotos()
    set({ ...initialState, photos: [] })
  },
}))

