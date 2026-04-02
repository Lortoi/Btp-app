import { PageWrapper } from "@/components/PageWrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useChantiers } from "@/context/ChantiersContext"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useLocation } from "wouter"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Upload,
} from "lucide-react"
import {
  type CostLine,
  type EstimationStep,
  type TvaRate,
  useEstimationStore,
} from "@/stores/estimationStore"
import {
  type SavedQuote,
  type QuoteDraft,
  SAVED_QUOTES_KEY,
  SAVED_QUOTES_SELECTED_ID_KEY,
  createDefaultDraft,
  nextQuoteNumber,
} from "@/components/quotes/quoteTypes"

type AddressSuggestion = { label: string }

const ORANGE = "#F97316"

export default function EstimationPage() {
  const [, setLocation] = useLocation()
  const { clients, addClient, addChantier } = useChantiers()

  const step = useEstimationStore((s) => s.step)
  const setStep = useEstimationStore((s) => s.setStep)
  const clearPhotos = useEstimationStore((s) => s.clearPhotos)
  const resetAll = useEstimationStore((s) => s.resetAll)

  useEffect(() => {
    return () => {
      clearPhotos()
    }
  }, [clearPhotos])

  const stepLabel =
    step === 1
      ? "Import des photos"
      : step === 2
        ? "Informations du chantier"
        : "Résultats"

  return (
    <PageWrapper>
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Estimation Automatique des Chantiers
            </h1>
            <p className="text-sm text-white/70">
              Étape {step}/3 — {stepLabel}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressSteps step={step} />
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <StepPanel active={step === 1}>
            <StepPhotos onNext={() => setStep(2)} />
          </StepPanel>

          <StepPanel active={step === 2}>
            <StepInfos
              clients={clients}
              onBack={() => setStep(1)}
              onLaunchAnalysis={() => {
                const st = useEstimationStore.getState()

                if (st.clientMode === "new" && st.newClientName.trim()) {
                  const id = Date.now().toString()
                  addClient({
                    id,
                    name: st.newClientName.trim(),
                    email: st.newClientEmail.trim(),
                    phone: st.newClientPhone.trim(),
                  })
                  st.setClientId(id)
                }

                const { margePct, aleasPct, tvaRate } = st
                const baseLines: CostLine[] = [
                  { poste: "Main d'œuvre", quantite: 1, puHT: 1200 },
                  { poste: "Matériaux", quantite: 1, puHT: 1000 },
                  { poste: "Matériel", quantite: 1, puHT: 150 },
                  { poste: "Sous-traitance", quantite: 1, puHT: 0 },
                  { poste: "Frais de chantier", quantite: 1, puHT: 200 },
                  { poste: "Provision aléas", quantite: 1, puHT: 0 },
                ]
                const totalHTRaw = baseLines.reduce(
                  (s, l) => s + l.quantite * l.puHT,
                  0,
                )
                const aleasAmount = round2(totalHTRaw * (aleasPct / 100))
                const lignes = baseLines.map((l) =>
                  l.poste === "Provision aléas" ? { ...l, puHT: aleasAmount } : l,
                )
                const totalHT = round2(
                  lignes.reduce((s, l) => s + l.quantite * l.puHT, 0),
                )
                const margeAmount = round2(totalHT * (margePct / 100))
                const totalHTAvecMarge = round2(totalHT + margeAmount)
                const tvaAmount = round2(totalHTAvecMarge * (tvaRate / 100))
                const totalTTC = round2(totalHTAvecMarge + tvaAmount)

                st.setResults({
                  lignes,
                  totalHT,
                  margePct,
                  margeAmount,
                  totalHTAvecMarge,
                  tvaRate,
                  tvaAmount,
                  totalTTC,
                })
                setStep(3)
              }}
            />
          </StepPanel>

          <StepPanel active={step === 3}>
            <StepResults
              clients={clients}
              onBack={() => setStep(2)}
              onReset={() => {
                resetAll()
                setStep(1)
              }}
              onSaveChantier={() => {
                const st = useEstimationStore.getState()
                const client = clients.find((c) => c.id === st.clientId) || null
                const chantierName = client ? `Chantier — ${client.name}` : "Chantier"
                addChantier({
                  id: Date.now().toString(),
                  nom: chantierName,
                  clientId: client?.id ?? "",
                  clientName: client?.name ?? "",
                  dateDebut: new Date().toISOString().slice(0, 10),
                  duree: st.dureeEstimee || "",
                  images: [],
                  statut: "planifié",
                })
              }}
              onGenerateDevis={() => {
                const st = useEstimationStore.getState()
                if (!st.results) return

                const existingClient = clients.find((c) => c.id === st.clientId) || null
                const clientNom =
                  existingClient?.name ||
                  (st.clientMode === "new" ? st.newClientName.trim() : "") ||
                  "Client"
                const clientEmail =
                  existingClient?.email ||
                  (st.clientMode === "new" ? st.newClientEmail.trim() : "") ||
                  ""
                const clientPhone =
                  existingClient?.phone ||
                  (st.clientMode === "new" ? st.newClientPhone.trim() : "") ||
                  ""

                const draftBase = createDefaultDraft()
                const numero = nextQuoteNumber()
                const tvaMode: QuoteDraft["financier"]["tvaMode"] =
                  st.tvaRate === 5.5 ? "5.5" : st.tvaRate === 10 ? "10" : "20"

                const lignes = st.results.lignes.map((l) => ({
                  id: crypto.randomUUID(),
                  description: l.poste,
                  quantity: l.quantite,
                  unite: "forfait" as const,
                  puHT: l.puHT,
                }))

                const draft: QuoteDraft = {
                  ...draftBase,
                  devis: {
                    ...draftBase.devis,
                    numero,
                  },
                  client: {
                    nom: clientNom,
                    adresse: st.localisation.trim() || "",
                    email: clientEmail,
                    phone: clientPhone,
                  },
                  lignes: lignes.length > 0 ? lignes : draftBase.lignes,
                  financier: {
                    ...draftBase.financier,
                    tvaMode,
                  },
                  notes: [
                    st.notes?.trim() ? st.notes.trim() : null,
                    st.surfaceM2?.trim() ? `Surface: ${st.surfaceM2.trim()} m²` : null,
                    st.typeTravaux ? `Type de travaux: ${st.typeTravaux}` : null,
                    st.corpsMetier ? `Corps de métier: ${st.corpsMetier}` : null,
                    st.dureeEstimee?.trim()
                      ? `Durée estimée: ${st.dureeEstimee.trim()}`
                      : null,
                    st.ouvriersEstimes?.trim()
                      ? `Ouvriers estimés: ${st.ouvriersEstimes.trim()}`
                      : null,
                    st.materiauxTags.length > 0
                      ? `Matériaux: ${st.materiauxTags.join(", ")}`
                      : null,
                    `Marge: ${st.margePct}% • Aléas: ${st.aleasPct}% • TVA: ${st.tvaRate}%`,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                }

                const saved: SavedQuote = {
                  id: crypto.randomUUID(),
                  numero,
                  clientNom,
                  createdAt: new Date().toISOString(),
                  draft,
                }

                try {
                  const raw = localStorage.getItem(SAVED_QUOTES_KEY)
                  const parsed = raw ? (JSON.parse(raw) as SavedQuote[]) : []
                  const next = [saved, ...(Array.isArray(parsed) ? parsed : [])]
                  localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(next))
                  localStorage.setItem(SAVED_QUOTES_SELECTED_ID_KEY, saved.id)
                } catch {
                  // ignore
                }

                setLocation("/dashboard/quotes")
              }}
            />
          </StepPanel>
        </div>
      </main>
    </PageWrapper>
  )
}

function StepPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
      transition={{ duration: 0.2 }}
      className={active ? "block" : "hidden"}
    >
      {children}
    </motion.div>
  )
}

function ProgressSteps({ step }: { step: EstimationStep }) {
  const items = [
    { n: 1, label: "Photos" },
    { n: 2, label: "Informations" },
    { n: 3, label: "Résultats" },
  ] as const

  return (
    <div className="flex items-center gap-3">
      {items.map((it, idx) => {
        const completed = step > it.n
        const active = step === it.n
        return (
          <div key={it.n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border"
                style={{
                  backgroundColor: completed
                    ? "rgba(34,197,94,0.2)"
                    : active
                      ? "rgba(249,115,22,0.18)"
                      : "rgba(255,255,255,0.06)",
                  borderColor: completed
                    ? "rgba(34,197,94,0.6)"
                    : active
                      ? ORANGE
                      : "rgba(255,255,255,0.15)",
                  color: completed
                    ? "rgb(34,197,94)"
                    : active
                      ? ORANGE
                      : "rgba(255,255,255,0.7)",
                }}
              >
                {completed ? "✓" : it.n}
              </div>
              <div
                className="text-xs font-medium"
                style={{
                  color: active
                    ? ORANGE
                    : completed
                      ? "rgb(34,197,94)"
                      : "rgba(255,255,255,0.7)",
                }}
              >
                {it.label}
              </div>
            </div>
            {idx < items.length - 1 && <div className="h-px w-10 bg-white/10" />}
          </div>
        )
      })}
    </div>
  )
}

function StepPhotos({ onNext }: { onNext: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const photos = useEstimationStore((s) => s.photos)
  const addPhotos = useEstimationStore((s) => s.addPhotos)
  const removePhoto = useEstimationStore((s) => s.removePhoto)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addPhotos(Array.from(e.dataTransfer.files))
  }

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addPhotos(Array.from(e.target.files || []))
    e.target.value = ""
  }

  return (
    <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-white/70" />
          Import des Photos du Chantier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onDrop={onDrop}
          className={
            "border-2 border-dashed rounded-lg p-10 md:p-12 text-center transition-colors " +
            (isDragging
              ? "border-white/40 bg-white/10"
              : "border-white/20 hover:border-white/30")
          }
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-white/70" />
          <p className="text-lg font-medium text-white mb-2">
            Glissez-déposez vos photos ici
          </p>
          <p className="text-sm text-white/60">ou cliquez pour sélectionner des fichiers</p>

          <div className="mt-5 flex flex-col items-center gap-2">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={onFileInput}
              className="hidden"
              id="photo-upload"
            />
            <Button
              variant="outline"
              className="text-white border-white/20 hover:bg-white/10"
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              Sélectionner des photos
            </Button>
            <div className="text-xs text-white/50">
              Formats acceptés : JPG, PNG, HEIC – Max 10 photos
            </div>
            <div className="text-xs text-white/70">
              <span className="tabular-nums">{photos.length}</span>/10 photos ajoutées
            </div>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-6">
            {photos.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.previewUrl}
                  alt={`Photo ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 border border-white/10 text-white rounded-full h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Supprimer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            onClick={onNext}
            disabled={photos.length === 0}
            className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30 disabled:opacity-50"
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StepInfos({
  clients,
  onBack,
  onLaunchAnalysis,
}: {
  clients: { id: string; name: string; email: string; phone: string }[]
  onBack: () => void
  onLaunchAnalysis: () => void
}) {
  const clientMode = useEstimationStore((s) => s.clientMode)
  const setClientMode = useEstimationStore((s) => s.setClientMode)
  const clientId = useEstimationStore((s) => s.clientId)
  const setClientId = useEstimationStore((s) => s.setClientId)
  const newClientName = useEstimationStore((s) => s.newClientName)
  const newClientEmail = useEstimationStore((s) => s.newClientEmail)
  const newClientPhone = useEstimationStore((s) => s.newClientPhone)
  const setNewClient = useEstimationStore((s) => s.setNewClient)

  const surfaceM2 = useEstimationStore((s) => s.surfaceM2)
  const typeTravaux = useEstimationStore((s) => s.typeTravaux)
  const corpsMetier = useEstimationStore((s) => s.corpsMetier)
  const localisation = useEstimationStore((s) => s.localisation)
  const dureeEstimee = useEstimationStore((s) => s.dureeEstimee)
  const ouvriersEstimes = useEstimationStore((s) => s.ouvriersEstimes)
  const notes = useEstimationStore((s) => s.notes)
  const setChantier = useEstimationStore((s) => s.setChantier)

  const materiauxTags = useEstimationStore((s) => s.materiauxTags)
  const addMateriauTag = useEstimationStore((s) => s.addMateriauTag)
  const removeMateriauTag = useEstimationStore((s) => s.removeMateriauTag)

  const tvaRate = useEstimationStore((s) => s.tvaRate)
  const margePct = useEstimationStore((s) => s.margePct)
  const aleasPct = useEstimationStore((s) => s.aleasPct)
  const setFinancier = useEstimationStore((s) => s.setFinancier)

  const [clientQuery, setClientQuery] = useState("")
  const [showClientMenu, setShowClientMenu] = useState(false)

  const [materiauInput, setMateriauInput] = useState("")

  const [addressQuery, setAddressQuery] = useState("")
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showAddressMenu, setShowAddressMenu] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, clientQuery])

  useEffect(() => {
    if (!addressQuery.trim()) {
      setAddressSuggestions([])
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressQuery.trim())}&limit=6`,
        )
        const json = (await res.json()) as any
        const feats = Array.isArray(json?.features) ? json.features : []
        const next = feats
          .map((f: any) => ({ label: String(f?.properties?.label || "").trim() }))
          .filter((x: AddressSuggestion) => x.label)
        setAddressSuggestions(next)
      } catch {
        setAddressSuggestions([])
      }
    }, 300)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [addressQuery])

  const requiredOk =
    surfaceM2.trim() && typeTravaux && corpsMetier && localisation.trim()

  return (
    <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-white/70" />
          Informations du Chantier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">👤 Client</h3>
          <div className="p-4 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl space-y-4">
            <div className="space-y-2 relative">
              <Label className="text-white">Nom du client</Label>
              <Input
                value={clientMode === "existing" ? clientQuery : newClientName}
                onChange={(e) => {
                  const v = e.target.value
                  if (clientMode === "existing") {
                    setClientQuery(v)
                    setShowClientMenu(true)
                    setClientId(null)
                  } else {
                    setNewClient({ newClientName: v })
                  }
                }}
                onFocus={() => {
                  if (clientMode === "existing") setShowClientMenu(true)
                }}
                placeholder="Rechercher un client…"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
              />

              {clientMode === "existing" && showClientMenu && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden">
                  {filteredClients.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-white/10"
                      onClick={() => {
                        setClientMode("existing")
                        setClientId(c.id)
                        setClientQuery(c.name)
                        setShowClientMenu(false)
                      }}
                    >
                      <div className="text-sm text-white">{c.name}</div>
                      <div className="text-xs text-white/50">{c.email}</div>
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="px-3 py-2 text-sm text-white/70">Aucun résultat</div>
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 border-t border-white/10 hover:bg-white/10 text-sm"
                    onClick={() => {
                      setClientMode("new")
                      setNewClient({ newClientName: clientQuery })
                      setShowClientMenu(false)
                      setClientId(null)
                    }}
                  >
                    + Créer nouveau client
                  </button>
                </div>
              )}

              {clientMode === "existing" && clientId && (
                <div className="text-xs text-white/60">Client sélectionné : {clientQuery}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Email (optionnel)</Label>
                <Input
                  value={newClientEmail}
                  onChange={(e) => setNewClient({ newClientEmail: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                  disabled={clientMode === "existing"}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Téléphone (optionnel)</Label>
                <Input
                  value={newClientPhone}
                  onChange={(e) => setNewClient({ newClientPhone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                  disabled={clientMode === "existing"}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">🏗️ Chantier</h3>
          <div className="p-4 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Surface (m²)</Label>
                <Input
                  type="number"
                  value={surfaceM2}
                  onChange={(e) => setChantier({ surfaceM2: e.target.value })}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                  placeholder="Ex: 50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Type de travaux</Label>
                <Select
                  value={typeTravaux}
                  onValueChange={(v) => setChantier({ typeTravaux: v as any })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuf">Neuf</SelectItem>
                    <SelectItem value="renovation">Rénovation</SelectItem>
                    <SelectItem value="extension">Extension</SelectItem>
                    <SelectItem value="demolition">Démolition</SelectItem>
                    <SelectItem value="second-oeuvre">Second œuvre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Corps de métier principal</Label>
                <Select
                  value={corpsMetier}
                  onValueChange={(v) => setChantier({ corpsMetier: v as any })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maconnerie">Maçonnerie</SelectItem>
                    <SelectItem value="electricite">Électricité</SelectItem>
                    <SelectItem value="plomberie">Plomberie</SelectItem>
                    <SelectItem value="carrelage">Carrelage</SelectItem>
                    <SelectItem value="peinture">Peinture</SelectItem>
                    <SelectItem value="menuiserie">Menuiserie</SelectItem>
                    <SelectItem value="charpente">Charpente</SelectItem>
                    <SelectItem value="couverture">Couverture</SelectItem>
                    <SelectItem value="isolation">Isolation</SelectItem>
                    <SelectItem value="multi-corps">Multi-corps (tous)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative">
                <Label className="text-white">Localisation</Label>
                <Input
                  value={addressQuery}
                  onChange={(e) => {
                    const v = e.target.value
                    setAddressQuery(v)
                    setShowAddressMenu(true)
                    setChantier({ localisation: v })
                  }}
                  onFocus={() => setShowAddressMenu(true)}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                  placeholder="Ex: Paris 75001"
                />
                {showAddressMenu && addressSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden">
                    {addressSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm text-white"
                        onClick={() => {
                          setChantier({ localisation: sug.label })
                          setAddressQuery(sug.label)
                          setShowAddressMenu(false)
                        }}
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                )}
                {!!localisation.trim() && (
                  <div className="text-xs text-white/60">Sélection : {localisation}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white">Nombre d'ouvriers estimé</Label>
                <Input
                  type="number"
                  value={ouvriersEstimes}
                  onChange={(e) => setChantier({ ouvriersEstimes: e.target.value })}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                  placeholder="Ex: 2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Durée estimée du chantier</Label>
                <Input
                  value={dureeEstimee}
                  onChange={(e) => setChantier({ dureeEstimee: e.target.value })}
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                  placeholder="Ex: 2 semaines"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Matériaux (tags)</Label>
              <Input
                value={materiauInput}
                onChange={(e) => setMateriauInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addMateriauTag(materiauInput)
                    setMateriauInput("")
                  }
                }}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                placeholder="Tape un matériau puis Entrée"
              />
              {materiauxTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {materiauxTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => removeMateriauTag(t)}
                      className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/15"
                      title="Supprimer"
                    >
                      {t} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white">Notes / contexte chantier</Label>
              <Textarea
                value={notes}
                onChange={(e) => setChantier({ notes: e.target.value })}
                className="bg-black/20 border-white/10 text-white placeholder:text-white/50"
                rows={4}
                placeholder="Décris le chantier, contraintes, contexte…"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">💰 Paramètres financiers</h3>
          <div className="p-4 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-white">Taux TVA applicable</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-xs text-white/60 underline decoration-white/30 underline-offset-2"
                    >
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    5,5% amélioration énergétique – 10% rénovation – 20% neuf
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={String(tvaRate)}
                onValueChange={(v) => setFinancier({ tvaRate: Number(v) as TvaRate })}
              >
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5.5">5,5%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Marge souhaitée (%)</Label>
                <div className="text-xs text-white/70 tabular-nums">{margePct}%</div>
              </div>
              <Slider
                value={[margePct]}
                min={5}
                max={30}
                step={1}
                onValueChange={(v) => setFinancier({ margePct: v[0] ?? 12 })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Provision pour aléas (%)</Label>
                <div className="text-xs text-white/70 tabular-nums">{aleasPct}%</div>
              </div>
              <Slider
                value={[aleasPct]}
                min={0}
                max={15}
                step={1}
                onValueChange={(v) => setFinancier({ aleasPct: v[0] ?? 5 })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={onBack}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={onLaunchAnalysis}
            disabled={!requiredOk}
            className="text-white font-semibold disabled:opacity-50"
            style={{ backgroundColor: ORANGE }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Lancer l'analyse
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StepResults({
  clients,
  onBack,
  onReset,
  onSaveChantier,
  onGenerateDevis,
}: {
  clients: { id: string; name: string; email: string; phone: string }[]
  onBack: () => void
  onReset: () => void
  onSaveChantier: () => void
  onGenerateDevis: () => void
}) {
  const results = useEstimationStore((s) => s.results)
  const margePct = useEstimationStore((s) => s.margePct)
  const tvaRate = useEstimationStore((s) => s.tvaRate)

  const clientName = useMemo(() => {
    const id = useEstimationStore.getState().clientId
    return clients.find((c) => c.id === id)?.name ?? ""
  }, [clients])

  if (!results) {
    return (
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader>
          <CardTitle>Résultats</CardTitle>
        </CardHeader>
        <CardContent className="text-white/70">Aucun résultat pour le moment.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Résultats (estimation){clientName ? ` — ${clientName}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-white">
                  <th className="text-left p-3">Poste</th>
                  <th className="text-right p-3">Quantité</th>
                  <th className="text-right p-3">PU HT</th>
                  <th className="text-right p-3">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {results.lignes.map((l) => (
                  <tr key={l.poste} className="border-t border-white/10">
                    <td className="p-3 text-white/90">{l.poste}</td>
                    <td className="p-3 text-right tabular-nums text-white/80">
                      {l.quantite}
                    </td>
                    <td className="p-3 text-right tabular-nums text-white/80">
                      {l.puHT.toFixed(2)} €
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium text-white">
                      {(l.quantite * l.puHT).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total HT</span>
              <span className="text-white tabular-nums font-medium">
                {results.totalHT.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Marge ({margePct}%)</span>
              <span className="text-white tabular-nums font-medium">
                {results.margeAmount.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">Total HT + marge</span>
              <span className="text-white tabular-nums font-medium">
                {results.totalHTAvecMarge.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/70">TVA ({tvaRate}%)</span>
              <span className="text-white tabular-nums font-medium">
                {results.tvaAmount.toFixed(2)} €
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="font-bold text-white">TOTAL TTC</span>
              <span className="font-bold text-white tabular-nums">
                {results.totalTTC.toFixed(2)} €
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Modifier les paramètres
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={onSaveChantier}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Sauvegarder en tant que chantier
              </Button>
              <Button
                onClick={onGenerateDevis}
                className="text-white font-semibold"
                style={{ backgroundColor: ORANGE }}
              >
                Générer le devis PDF
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onReset}
              className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30"
            >
              Nouvelle estimation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

