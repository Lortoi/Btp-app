import { useEffect, useMemo, useState } from "react"
import { useCardHover } from "@/hooks/useCardHover"
import { pdf } from "@react-pdf/renderer"
import { PageWrapper } from "@/components/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuotePreview } from "@/components/quotes/QuotePreview"
import { QuotePdfDocument } from "@/components/quotes/QuotePdfDocument"
import {
  type FormeJuridique,
  type LignePrestation,
  type QuoteDraft,
  type SavedQuote,
  type TvaMode,
  type UnitePrestation,
  QUOTE_STORAGE_KEY,
  SAVED_QUOTES_KEY,
  SAVED_QUOTES_SELECTED_ID_KEY,
  computeTotals,
  createDefaultDraft,
  isSociete,
  round2,
  sanitizeFilenamePart,
  uniteLabel,
} from "@/components/quotes/quoteTypes"
import { Building2, ChevronLeft, ChevronRight, Download, Plus, Trash2, Upload, Wand2 } from "lucide-react"
import { agentDebugLog } from "@/lib/agentDebugLog"
import { fetchClients, type ClientRow } from "@/lib/supabase"

const UNITS_IA: readonly UnitePrestation[] = ["m2", "ml", "h", "forfait", "u"]

const STEPS = [
  { id: 1, label: "Mon entreprise" },
  { id: 2, label: "Client" },
  { id: 3, label: "Prestations" },
  { id: 4, label: "Récapitulatif" },
] as const

const STEP_BORDER: Record<number, string> = {
  1: "#3b82f6",
  2: "#e8702a",
  3: "#f59e0b",
  4: "#22c55e",
}

const inputClass =
  "bg-[var(--input)] border-border text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"

const labelClass = "text-[var(--muted-foreground)] text-xs uppercase tracking-wide font-medium"

function parseClaudePrestationsJson(raw: string): LignePrestation[] {
  const trimmed = raw.trim()
  let jsonStr = trimmed
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fence) jsonStr = fence[1].trim()
  const first = jsonStr.indexOf("[")
  const last = jsonStr.lastIndexOf("]")
  if (first >= 0 && last > first) {
    jsonStr = jsonStr.slice(first, last + 1)
  }
  const parsed: unknown = JSON.parse(jsonStr)
  if (!Array.isArray(parsed)) {
    throw new Error("La réponse n'est pas un tableau JSON.")
  }
  const lignes: LignePrestation[] = []
  for (const row of parsed) {
    if (!row || typeof row !== "object") continue
    const r = row as Record<string, unknown>
    const desc = String(r.description ?? "").trim()
    if (!desc) continue
    const q = r.quantity
    const quantity =
      typeof q === "number" && !Number.isNaN(q)
        ? q
        : typeof q === "string"
          ? parseFloat(q) || 0
          : 0
    const p = r.puHT
    const puHT =
      typeof p === "number" && !Number.isNaN(p)
        ? p
        : typeof p === "string"
          ? parseFloat(p) || 0
          : 0
    const uRaw = String(r.unite ?? "u").toLowerCase()
    const unite = (UNITS_IA.includes(uRaw as UnitePrestation) ? uRaw : "u") as UnitePrestation
    lignes.push({
      id: crypto.randomUUID(),
      description: desc,
      quantity,
      unite,
      puHT: round2(puHT),
    })
  }
  if (lignes.length === 0) {
    throw new Error("Aucune ligne de prestation exploitable dans la réponse.")
  }
  return lignes
}

function WizardProgress({ step }: { step: number }) {
  return (
    <div className="px-6 py-5 border-b border-border shrink-0 overflow-x-auto">
      <div className="flex items-center min-w-[520px] max-w-3xl mx-auto">
        {STEPS.map((s, index) => {
          const isPast = step > s.id
          const isActive = step === s.id
          const isFuture = step < s.id

          let circleBg = "#7c3aed"
          let circleColor = "#ffffff"
          if (isPast) {
            circleBg = "#22c55e"
            circleColor = "#ffffff"
          } else if (isFuture) {
            circleBg = "hsl(var(--muted))"
            circleColor = "var(--muted-foreground)"
          }

          const lineColor = isPast ? "#22c55e" : "hsl(var(--muted))"

          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors"
                  style={{ background: circleBg, color: circleColor }}
                >
                  {s.id}
                </div>
                <span
                  className="text-xs font-medium whitespace-nowrap hidden sm:block"
                  style={{
                    color: isActive ? "#7c3aed" : isPast ? "#22c55e" : "var(--muted-foreground)",
                  }}
                >
                  {s.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-2 sm:mx-3 min-w-[24px] transition-colors"
                  style={{ background: lineColor }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WizardNav({
  step,
  onPrev,
  onNext,
}: {
  step: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6 mt-2 border-t border-border">
      <button
        type="button"
        onClick={onPrev}
        disabled={step <= 1}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        }}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Précédent
      </button>
      {step < 4 ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-medium text-white"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Suivant
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}

export default function QuotesPage() {
  const [draft, setDraft] = useState<QuoteDraft | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [step, setStep] = useState(1)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUOTE_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as QuoteDraft
        setDraft(parsed)
      } else {
        setDraft(createDefaultDraft())
      }
    } catch {
      setDraft(createDefaultDraft())
    }
  }, [])

  useEffect(() => {
    try {
      const selectedId = localStorage.getItem(SAVED_QUOTES_SELECTED_ID_KEY)
      if (!selectedId) return
      localStorage.removeItem(SAVED_QUOTES_SELECTED_ID_KEY)

      const raw = localStorage.getItem(SAVED_QUOTES_KEY)
      const parsed = raw ? (JSON.parse(raw) as SavedQuote[]) : []
      const match = Array.isArray(parsed) ? parsed.find((q) => q.id === selectedId) : undefined
      if (match?.draft) {
        setDraft(match.draft)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!draft) return
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(draft))
      } catch {
        /* ignore quota */
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [draft])

  const totals = useMemo(() => (draft ? computeTotals(draft) : null), [draft])

  const addLigne = () => {
    if (!draft) return
    const ligne: LignePrestation = {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unite: "u",
      puHT: 0,
    }
    setDraft({ ...draft, lignes: [...draft.lignes, ligne] })
  }

  const removeLigne = (id: string) => {
    if (!draft || draft.lignes.length <= 1) return
    setDraft({ ...draft, lignes: draft.lignes.filter((l) => l.id !== id) })
  }

  const updateLigne = (id: string, patch: Partial<LignePrestation>) => {
    if (!draft) return
    setDraft({
      ...draft,
      lignes: draft.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })
  }

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !draft) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      setDraft({
        ...draft,
        company: { ...draft.company, logoBase64: data },
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleDownloadPdf = async () => {
    if (!draft || !totals) return
    agentDebugLog(
      "QuotesPage.tsx:handleDownloadPdf",
      "pdf generation start",
      {},
      "H5-async-pdf-or-promise",
    )
    setPdfLoading(true)
    try {
      const doc = <QuotePdfDocument draft={draft} totals={totals} />
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const numero = sanitizeFilenamePart(draft.devis.numero || "SANS_NUM")
      const client = sanitizeFilenamePart(draft.client.nom || "Client")
      const link = document.createElement("a")
      link.href = url
      link.download = `Devis_${numero}_${client}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      agentDebugLog(
        "QuotesPage.tsx:handleDownloadPdf",
        "pdf generation end",
        {},
        "H5-async-pdf-or-promise",
      )
      setPdfLoading(false)
    }
  }

  if (!draft || !totals) {
    return (
      <PageWrapper>
        <div className="p-6 text-[var(--foreground)]">Chargement…</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="flex flex-col flex-1 min-h-0 h-full overflow-x-hidden w-full max-w-full">
        <header className="shrink-0 surface-header backdrop-blur-sm px-6 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Générateur de Devis</h1>
        </header>

        <WizardProgress step={step} />

        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          <QuoteWizardForm
            step={step}
            setStep={setStep}
            draft={draft}
            setDraft={setDraft}
            totals={totals}
            addLigne={addLigne}
            removeLigne={removeLigne}
            updateLigne={updateLigne}
            onLogoChange={onLogoChange}
            handleDownloadPdf={handleDownloadPdf}
            pdfLoading={pdfLoading}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

function QuoteWizardForm({
  step,
  setStep,
  draft,
  setDraft,
  totals,
  addLigne,
  removeLigne,
  updateLigne,
  onLogoChange,
  handleDownloadPdf,
  pdfLoading,
}: {
  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>
  draft: QuoteDraft
  setDraft: React.Dispatch<React.SetStateAction<QuoteDraft | null>>
  totals: ReturnType<typeof computeTotals>
  addLigne: () => void
  removeLigne: (id: string) => void
  updateLigne: (id: string, patch: Partial<LignePrestation>) => void
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleDownloadPdf: () => Promise<void>
  pdfLoading: boolean
}) {
  const showCapital = isSociete(draft.company.formeJuridique)
  const [iaChantierDesc, setIaChantierDesc] = useState("")
  const [iaLoading, setIaLoading] = useState(false)
  const [iaError, setIaError] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [clientMode, setClientMode] = useState<"existing" | "new">("new")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const { getHoverProps, getHoverStyle } = useCardHover()

  useEffect(() => {
    void fetchClients().then(setClients)
  }, [])

  const handleGenerateIaPrestations = async () => {
    const description = iaChantierDesc.trim()
    if (!description) {
      setIaError("Décrivez le chantier avant de générer.")
      return
    }
    setIaError(null)
    setIaLoading(true)
    try {
      const prompt = `Tu es un expert BTP. Génère des lignes de devis en JSON pour ce chantier : ${description}. Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour, au format : [{\"description\":\"...\",\"quantity\":1,\"unite\":\"u\",\"puHT\":0}]. Les unités possibles sont : m2, ml, h, forfait, u.`
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = (await res.json()) as { text?: string; message?: string; detail?: string }
      if (!res.ok) {
        const msg = data.message ?? `Erreur ${res.status}`
        const detail = data.detail ? ` — ${data.detail}` : ""
        throw new Error(`${msg}${detail}`)
      }
      const text = data.text
      if (typeof text !== "string" || !text.trim()) {
        throw new Error("Réponse vide du serveur.")
      }
      const nouvellesLignes = parseClaudePrestationsJson(text)
      setDraft((prev) => {
        if (!prev) return prev
        return { ...prev, lignes: nouvellesLignes }
      })
    } catch (e) {
      setIaError(e instanceof Error ? e.message : "Échec de la génération.")
    } finally {
      setIaLoading(false)
    }
  }

  const applyExistingClient = (clientId: string) => {
    setSelectedClientId(clientId)
    const client = clients.find((c) => c.id === clientId)
    if (!client) return
    setDraft({
      ...draft,
      client: {
        nom: client.nom,
        adresse: client.adresse ?? "",
        email: client.email ?? "",
        phone: client.telephone ?? "",
      },
    })
  }

  const stepCardStyle = {
    borderLeft: `4px solid ${STEP_BORDER[step] ?? "#7c3aed"}`,
  }

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {step === 1 && (
        <Card
          className="surface-card backdrop-blur-sm text-[var(--foreground)] overflow-hidden"
          {...getHoverProps("quote_company")}
          style={{ ...stepCardStyle, ...getHoverStyle("quote_company", "#3b82f6") }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Building2 className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
              Mon entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className={labelClass}>Logo (PNG / JPG)</Label>
              <div className="flex items-center gap-4 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="text-[var(--foreground)] border-border"
                  asChild
                >
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2 inline" />
                    Téléverser
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={onLogoChange}
                    />
                  </label>
                </Button>
                {draft.company.logoBase64 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <img
                      src={draft.company.logoBase64}
                      alt="Logo"
                      className="h-16 w-16 object-contain rounded border border-border bg-[var(--input)]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="text-[var(--foreground)] border-border hover:bg-red-500/15 hover:border-red-400/35"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          company: { ...draft.company, logoBase64: null },
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Retirer le logo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="rs" className={labelClass}>
                  Raison sociale
                </Label>
                <Input
                  id="rs"
                  value={draft.company.raisonSociale}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: { ...draft.company, raisonSociale: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Forme juridique</Label>
                <Select
                  value={draft.company.formeJuridique}
                  onValueChange={(v: FormeJuridique) =>
                    setDraft({
                      ...draft,
                      company: { ...draft.company, formeJuridique: v },
                    })
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-entrepreneur">Auto-entrepreneur</SelectItem>
                    <SelectItem value="EURL">EURL</SelectItem>
                    <SelectItem value="SASU">SASU</SelectItem>
                    <SelectItem value="SAS">SAS</SelectItem>
                    <SelectItem value="SARL">SARL</SelectItem>
                    <SelectItem value="SA">SA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siret" className={labelClass}>
                  SIRET
                </Label>
                <Input
                  id="siret"
                  value={draft.company.siret}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: { ...draft.company, siret: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="adresse-ent" className={labelClass}>
                  Adresse complète
                </Label>
                <Textarea
                  id="adresse-ent"
                  value={draft.company.adresse}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: { ...draft.company, adresse: e.target.value },
                    })
                  }
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tva-intra" className={labelClass}>
                  N° TVA intracommunautaire
                </Label>
                <Input
                  id="tva-intra"
                  value={draft.company.tvaIntra}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: { ...draft.company, tvaIntra: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              {showCapital && (
                <div className="space-y-2">
                  <Label htmlFor="capital" className={labelClass}>
                    Capital social
                  </Label>
                  <Input
                    id="capital"
                    value={draft.company.capitalSocial}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        company: { ...draft.company, capitalSocial: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className={labelClass}>Assurance décennale — Assureur</Label>
                <Input
                  value={draft.company.decennale.assureur}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: {
                        ...draft.company,
                        decennale: { ...draft.company.decennale, assureur: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>N° contrat</Label>
                <Input
                  value={draft.company.decennale.contrat}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: {
                        ...draft.company,
                        decennale: { ...draft.company.decennale, contrat: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClass}>Zone couverte</Label>
                <Input
                  value={draft.company.decennale.zone}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      company: {
                        ...draft.company,
                        decennale: { ...draft.company.decennale, zone: e.target.value },
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <WizardNav step={step} onPrev={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)} />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card
          className="surface-card backdrop-blur-sm text-[var(--foreground)] overflow-hidden"
          {...getHoverProps("quote_client")}
          style={{ ...stepCardStyle, ...getHoverStyle("quote_client", "#e8702a") }}
        >
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                className="px-4 py-2 rounded-[10px] text-sm font-medium transition-colors"
                style={{
                  background:
                    clientMode === "existing" ? "rgba(232,112,42,0.2)" : "transparent",
                  border:
                    clientMode === "existing"
                      ? "1px solid rgba(232,112,42,0.5)"
                      : "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Client existant
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientMode("new")
                  setSelectedClientId("")
                }}
                className="px-4 py-2 rounded-[10px] text-sm font-medium transition-colors"
                style={{
                  background: clientMode === "new" ? "rgba(232,112,42,0.2)" : "transparent",
                  border:
                    clientMode === "new"
                      ? "1px solid rgba(232,112,42,0.5)"
                      : "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Nouveau client
              </button>
            </div>

            {clientMode === "existing" ? (
              <div className="space-y-2">
                <Label className={labelClass}>Sélectionner un client</Label>
                <Select
                  value={selectedClientId || undefined}
                  onValueChange={applyExistingClient}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Choisir dans la liste…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                        {c.email ? ` — ${c.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Aucun client en base. Passez en mode « Nouveau client ».
                  </p>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="client-nom" className={labelClass}>
                  Nom / Raison sociale
                </Label>
                <Input
                  id="client-nom"
                  value={draft.client.nom}
                  disabled={clientMode === "existing" && !!selectedClientId}
                  onChange={(e) =>
                    setDraft({ ...draft, client: { ...draft.client, nom: e.target.value } })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="client-adr" className={labelClass}>
                  Adresse complète
                </Label>
                <Textarea
                  id="client-adr"
                  value={draft.client.adresse}
                  disabled={clientMode === "existing" && !!selectedClientId}
                  onChange={(e) =>
                    setDraft({ ...draft, client: { ...draft.client, adresse: e.target.value } })
                  }
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-email" className={labelClass}>
                  Email
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  value={draft.client.email}
                  disabled={clientMode === "existing" && !!selectedClientId}
                  onChange={(e) =>
                    setDraft({ ...draft, client: { ...draft.client, email: e.target.value } })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-tel" className={labelClass}>
                  Téléphone
                </Label>
                <Input
                  id="client-tel"
                  value={draft.client.phone}
                  disabled={clientMode === "existing" && !!selectedClientId}
                  onChange={(e) =>
                    setDraft({ ...draft, client: { ...draft.client, phone: e.target.value } })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="numero" className={labelClass}>
                  Numéro de devis
                </Label>
                <Input
                  id="numero"
                  value={draft.devis.numero}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      devis: { ...draft.devis, numero: e.target.value },
                    })
                  }
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-em" className={labelClass}>
                  Date d&apos;émission
                </Label>
                <Input
                  id="date-em"
                  type="date"
                  value={draft.devis.dateEmission}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      devis: { ...draft.devis, dateEmission: e.target.value },
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validite" className={labelClass}>
                  Validité (jours)
                </Label>
                <Input
                  id="validite"
                  type="number"
                  min={1}
                  value={draft.devis.validiteJours}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      devis: {
                        ...draft.devis,
                        validiteJours: Math.max(1, parseInt(e.target.value, 10) || 30),
                      },
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <WizardNav step={step} onPrev={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)} />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card
          className="surface-card backdrop-blur-sm text-[var(--foreground)] overflow-hidden"
          {...getHoverProps("quote_lignes")}
          style={{ ...stepCardStyle, ...getHoverStyle("quote_lignes", "#f59e0b") }}
        >
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-[var(--foreground)]">Prestations</CardTitle>
            <Button
              type="button"
              size="sm"
              onClick={addLigne}
              className="shrink-0 border-border text-[var(--foreground)]"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              className="rounded-xl p-4 space-y-4"
              style={{
                borderLeft: "4px solid #7c3aed",
                background: "rgba(124,58,237,0.08)",
              }}
              {...getHoverProps("quote_ia")}
            >
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 shrink-0" style={{ color: "#a78bfa" }} />
                <span className="font-semibold text-[var(--foreground)]">
                  Générer les prestations avec l&apos;IA
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ia-chantier-desc" className={labelClass}>
                  Description du chantier
                </Label>
                <Textarea
                  id="ia-chantier-desc"
                  value={iaChantierDesc}
                  onChange={(e) => {
                    setIaChantierDesc(e.target.value)
                    if (iaError) setIaError(null)
                  }}
                  disabled={iaLoading}
                  placeholder="Décrivez le chantier… ex: pose de carrelage 30m² salle de bain, fourniture comprise"
                  rows={4}
                  className={`${inputClass} resize-y min-h-[100px]`}
                />
              </div>
              <Button
                type="button"
                disabled={iaLoading}
                onClick={handleGenerateIaPrestations}
                className="ai-btn disabled:opacity-60"
              >
                {iaLoading ? "Génération en cours…" : "Générer avec l'IA"}
              </Button>
              {iaError ? <p className="text-sm text-red-400">{iaError}</p> : null}
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border" style={{ background: "hsl(var(--muted))" }}>
                    <th className="text-left px-3 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>
                      Description
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-24" style={{ color: "var(--muted-foreground)" }}>
                      Qté
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-32" style={{ color: "var(--muted-foreground)" }}>
                      Unité
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-32" style={{ color: "var(--muted-foreground)" }}>
                      PU HT (€)
                    </th>
                    <th className="text-left px-3 py-3 font-medium w-28" style={{ color: "var(--muted-foreground)" }}>
                      Total HT
                    </th>
                    <th className="w-12 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {draft.lignes.map((ligne, index) => {
                    const lineTotal = round2(ligne.quantity * ligne.puHT)
                    return (
                      <tr key={ligne.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 align-middle">
                          <Input
                            value={ligne.description}
                            onChange={(e) => updateLigne(ligne.id, { description: e.target.value })}
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={ligne.quantity}
                            onChange={(e) =>
                              updateLigne(ligne.id, { quantity: parseFloat(e.target.value) || 0 })
                            }
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Select
                            value={ligne.unite}
                            onValueChange={(v: UnitePrestation) => updateLigne(ligne.id, { unite: v })}
                          >
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="m2">{uniteLabel("m2")}</SelectItem>
                              <SelectItem value="ml">{uniteLabel("ml")}</SelectItem>
                              <SelectItem value="h">{uniteLabel("h")}</SelectItem>
                              <SelectItem value="forfait">{uniteLabel("forfait")}</SelectItem>
                              <SelectItem value="u">{uniteLabel("u")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={ligne.puHT}
                            onChange={(e) =>
                              updateLigne(ligne.id, { puHT: parseFloat(e.target.value) || 0 })
                            }
                            className={inputClass}
                          />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <div
                            className="h-10 px-3 flex items-center rounded-[10px] border border-border text-[var(--foreground)] font-medium"
                            style={{ background: "var(--input)" }}
                          >
                            {lineTotal.toFixed(2)} €
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle text-center">
                          {draft.lignes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLigne(ligne.id)}
                              aria-label={`Supprimer ligne ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <WizardNav step={step} onPrev={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)} />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card
          className="surface-card backdrop-blur-sm text-[var(--foreground)] overflow-hidden"
          {...getHoverProps("quote_financier")}
          style={{ ...stepCardStyle, ...getHoverStyle("quote_financier", "#22c55e") }}
        >
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-border p-4 space-y-3" style={{ background: "var(--input)" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--muted-foreground)" }}>Total HT</span>
                    <span className="font-medium text-[var(--foreground)]">{totals.totalHT.toFixed(2)} €</span>
                  </div>
                  <div className="space-y-2">
                    <Label className={labelClass}>TVA</Label>
                    <Select
                      value={draft.financier.tvaMode}
                      onValueChange={(v: TvaMode) =>
                        setDraft({
                          ...draft,
                          financier: { ...draft.financier, tvaMode: v },
                        })
                      }
                    >
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 %</SelectItem>
                        <SelectItem value="10">10 %</SelectItem>
                        <SelectItem value="5.5">5,5 %</SelectItem>
                        <SelectItem value="0">0 %</SelectItem>
                        <SelectItem value="293B">Non applicable — art. 293 B CGI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "var(--muted-foreground)" }}>Montant TVA</span>
                    <span className="font-medium text-[var(--foreground)]">{totals.montantTVA.toFixed(2)} €</span>
                  </div>
                  <div
                    className="flex justify-between items-center rounded-lg px-4 py-3"
                    style={{
                      border: "2px solid #22c55e",
                      background: "rgba(34,197,94,0.12)",
                    }}
                  >
                    <span className="font-bold text-lg text-[var(--foreground)]">Total TTC</span>
                    <span className="font-bold text-2xl text-[var(--foreground)]">
                      {totals.totalTTC.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modalites" className={labelClass}>
                    Modalités de paiement
                  </Label>
                  <Textarea
                    id="modalites"
                    value={draft.financier.modalitesPaiement}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        financier: { ...draft.financier, modalitesPaiement: e.target.value },
                      })
                    }
                    rows={3}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penalites" className={labelClass}>
                    Pénalités de retard
                  </Label>
                  <Textarea
                    id="penalites"
                    value={draft.financier.penalitesRetard}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        financier: { ...draft.financier, penalitesRetard: e.target.value },
                      })
                    }
                    rows={2}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className={labelClass}>
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    rows={4}
                    placeholder="Conditions générales, remarques…"
                    className={inputClass}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] text-sm font-medium text-white w-full sm:w-auto justify-center disabled:opacity-70"
                  style={{
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    border: "none",
                    cursor: pdfLoading ? "not-allowed" : "pointer",
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {pdfLoading ? "Génération…" : "Télécharger le PDF"}
                </button>
              </div>

              <div className="min-w-0">
                <QuotePreview draft={draft} totals={totals} />
              </div>
            </div>

            <WizardNav step={step} onPrev={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
