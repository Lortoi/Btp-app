import { useEffect, useMemo, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Building2, Download, Plus, Trash2, Upload } from "lucide-react"
import { agentDebugLog } from "@/lib/agentDebugLog"

export default function QuotesPage() {
  const [draft, setDraft] = useState<QuoteDraft | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([])

  const persistSavedQuotes = (next: SavedQuote[]) => {
    setSavedQuotes(next)
    try {
      localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

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
      const raw = localStorage.getItem(SAVED_QUOTES_KEY)
      const parsed = raw ? (JSON.parse(raw) as SavedQuote[]) : []
      setSavedQuotes(Array.isArray(parsed) ? parsed : [])
    } catch {
      setSavedQuotes([])
    }
  }, [])

  useEffect(() => {
    // Open quote created elsewhere (ex: Estimation step 3)
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
    try {
      localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(draft))
    } catch {
      /* ignore quota */
    }
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
    // #region agent log
    agentDebugLog(
      "QuotesPage.tsx:handleDownloadPdf",
      "pdf generation start",
      {},
      "H5-async-pdf-or-promise",
    )
    // #endregion
    setPdfLoading(true)
    try {
      const doc = <QuotePdfDocument draft={draft} totals={totals} />
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const num = sanitizeFilenamePart(draft.devis.numero || "SANS_NUM")
      const client = sanitizeFilenamePart(draft.client.nom || "Client")
      a.download = `Devis_${num}_${client}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      // #region agent log
      agentDebugLog(
        "QuotesPage.tsx:handleDownloadPdf",
        "pdf generation end",
        {},
        "H5-async-pdf-or-promise",
      )
      // #endregion
      setPdfLoading(false)
    }
  }

  const previewBlock = draft && totals && (
    <div className="space-y-4">
      <div className="flex justify-end shrink-0">
        <Button
          type="button"
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="bg-[#1e3a5f] hover:bg-[#152a45] text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          {pdfLoading ? "Génération…" : "Télécharger le PDF"}
        </Button>
      </div>
      <QuotePreview draft={draft} totals={totals} />
    </div>
  )

  const savedQuotesBlock = (
    <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
      <CardHeader>
        <CardTitle>Devis générés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {savedQuotes.length === 0 ? (
          <div className="text-sm text-white/60">Aucun devis généré pour le moment.</div>
        ) : (
          <div className="space-y-2">
            {savedQuotes
              .slice()
              .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
              .slice(0, 20)
              .map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {q.numero || "DEV-—"} — {q.clientNom || "Client"}
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(q.createdAt).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/10"
                      onClick={() => setDraft(q.draft)}
                    >
                      Ouvrir
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const next = savedQuotes.filter((x) => x.id !== q.id)
                        persistSavedQuotes(next)
                      }}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (!draft || !totals) {
    return (
      <PageWrapper>
        <div className="p-6 text-white">Chargement…</div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="flex flex-col flex-1 min-h-0 h-full">
        <header className="shrink-0 bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Générateur de Devis</h1>
          <p className="text-sm text-white/70">
            Saisie à gauche, aperçu en temps réel à droite (enregistrement automatique)
          </p>
        </header>

        {/* Mobile: tabs */}
        <div className="flex-1 min-h-0 flex flex-col md:hidden">
          <Tabs
            defaultValue="form"
            className="flex flex-col flex-1 min-h-0"
            onValueChange={(v) => {
              // #region agent log
              agentDebugLog(
                "QuotesPage.tsx:Tabs",
                "mobile tab changed",
                { value: v },
                "H2-radix-tabs",
              )
              // #endregion
            }}
          >
            <TabsList className="mx-4 mt-4 shrink-0 bg-black/30 border border-white/10">
              <TabsTrigger value="form" className="data-[state=active]:bg-white/20 text-white">
                Formulaire
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-white/20 text-white">
                Aperçu
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="form"
              className="flex-1 overflow-y-auto mt-0 p-4 data-[state=inactive]:hidden"
            >
              <div className="mb-6">
                {savedQuotesBlock}
              </div>
              <QuoteForm
                draft={draft}
                setDraft={setDraft}
                addLigne={addLigne}
                removeLigne={removeLigne}
                updateLigne={updateLigne}
                onLogoChange={onLogoChange}
              />
            </TabsContent>
            <TabsContent
              value="preview"
              className="flex-1 overflow-y-auto p-4 mt-0 data-[state=inactive]:hidden"
            >
              {previewBlock}
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop: 50/50 */}
        <div className="hidden md:flex flex-1 min-h-0 flex-row">
          <div className="w-1/2 overflow-y-auto p-6 border-r border-white/10">
            <div className="mb-6">
              {savedQuotesBlock}
            </div>
            <QuoteForm
              draft={draft}
              setDraft={setDraft}
              addLigne={addLigne}
              removeLigne={removeLigne}
              updateLigne={updateLigne}
              onLogoChange={onLogoChange}
            />
          </div>
          <div className="w-1/2 flex flex-col min-h-0 bg-black/10">
            <div className="sticky top-0 z-20 shrink-0 p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl flex justify-end">
              <Button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="bg-[#1e3a5f] hover:bg-[#152a45] text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {pdfLoading ? "Génération…" : "Télécharger le PDF"}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <QuotePreview draft={draft} totals={totals} />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

function QuoteForm({
  draft,
  setDraft,
  addLigne,
  removeLigne,
  updateLigne,
  onLogoChange,
}: {
  draft: QuoteDraft
  setDraft: React.Dispatch<React.SetStateAction<QuoteDraft | null>>
  addLigne: () => void
  removeLigne: (id: string) => void
  updateLigne: (id: string, patch: Partial<LignePrestation>) => void
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const showCapital = isSociete(draft.company.formeJuridique)

  return (
    <div className="space-y-6 pb-8">
      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mon entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Logo (PNG / JPG)</Label>
            <div className="flex items-center gap-4 flex-wrap">
              <Button type="button" variant="outline" className="text-white border-white/20" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2 inline" />
                  Téléverser
                  <input type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={onLogoChange} />
                </label>
              </Button>
              {draft.company.logoBase64 && (
                <img
                  src={draft.company.logoBase64}
                  alt="Logo"
                  className="h-16 w-16 object-contain rounded border border-white/20 bg-white/10"
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rs" className="text-white">Raison sociale</Label>
            <Input
              id="rs"
              value={draft.company.raisonSociale}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  company: { ...draft.company, raisonSociale: e.target.value },
                })
              }
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Forme juridique</Label>
            <Select
              value={draft.company.formeJuridique}
              onValueChange={(v: FormeJuridique) =>
                setDraft({
                  ...draft,
                  company: { ...draft.company, formeJuridique: v },
                })
              }
            >
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
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
            <Label htmlFor="adresse-ent" className="text-white">Adresse complète</Label>
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
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siret" className="text-white">SIRET</Label>
              <Input
                id="siret"
                value={draft.company.siret}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    company: { ...draft.company, siret: e.target.value },
                  })
                }
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tva-intra" className="text-white">N° TVA intracommunautaire</Label>
              <Input
                id="tva-intra"
                value={draft.company.tvaIntra}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    company: { ...draft.company, tvaIntra: e.target.value },
                  })
                }
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>
          {showCapital && (
            <div className="space-y-2">
              <Label htmlFor="capital" className="text-white">Capital social</Label>
              <Input
                id="capital"
                value={draft.company.capitalSocial}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    company: { ...draft.company, capitalSocial: e.target.value },
                  })
                }
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Assurance décennale — Assureur</Label>
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
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">N° contrat</Label>
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
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Zone couverte</Label>
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
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader>
          <CardTitle>Devis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numero" className="text-white">Numéro de devis</Label>
            <Input
              id="numero"
              value={draft.devis.numero}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  devis: { ...draft.devis, numero: e.target.value },
                })
              }
              className="bg-black/20 border-white/10 text-white font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-em" className="text-white">Date d&apos;émission</Label>
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
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validite" className="text-white">Durée de validité (jours)</Label>
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
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-nom" className="text-white">Nom / Raison sociale</Label>
            <Input
              id="client-nom"
              value={draft.client.nom}
              onChange={(e) =>
                setDraft({ ...draft, client: { ...draft.client, nom: e.target.value } })
              }
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-adr" className="text-white">Adresse complète</Label>
            <Textarea
              id="client-adr"
              value={draft.client.adresse}
              onChange={(e) =>
                setDraft({ ...draft, client: { ...draft.client, adresse: e.target.value } })
              }
              rows={3}
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-white">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={draft.client.email}
                onChange={(e) =>
                  setDraft({ ...draft, client: { ...draft.client, email: e.target.value } })
                }
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-tel" className="text-white">Téléphone</Label>
              <Input
                id="client-tel"
                value={draft.client.phone}
                onChange={(e) =>
                  setDraft({ ...draft, client: { ...draft.client, phone: e.target.value } })
                }
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3 space-y-0 p-6 pb-5">
          <CardTitle className="text-xl md:text-2xl tracking-tight">
            Prestations
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={addLigne}
            className="shrink-0 bg-white/20 text-white border-white/20 px-4 h-9"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {draft.lignes.map((ligne, index) => {
            const lineTotal = round2(ligne.quantity * ligne.puHT)
            return (
              <div
                key={ligne.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-4 p-5 rounded-xl bg-black/20 border border-white/10"
              >
                <div className="lg:col-span-4 space-y-2">
                  <Label className="text-white">Description</Label>
                  <Input
                    value={ligne.description}
                    onChange={(e) => updateLigne(ligne.id, { description: e.target.value })}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label className="text-white">Quantité</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={ligne.quantity}
                    onChange={(e) =>
                      updateLigne(ligne.id, { quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label className="text-white">Unité</Label>
                  <Select
                    value={ligne.unite}
                    onValueChange={(v: UnitePrestation) => updateLigne(ligne.id, { unite: v })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
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
                </div>
                <div className="lg:col-span-2 space-y-2">
                  <Label className="text-white">Prix unitaire HT (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={ligne.puHT}
                    onChange={(e) =>
                      updateLigne(ligne.id, { puHT: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="lg:col-span-1 space-y-2">
                  <Label className="text-white">Total HT</Label>
                  <div className="h-10 px-3 flex items-center rounded-md border border-white/10 bg-black/30 text-sm font-medium">
                    {lineTotal.toFixed(2)} €
                  </div>
                </div>
                <div className="lg:col-span-1 flex items-end justify-end">
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
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader>
          <CardTitle>Financier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const t = computeTotals(draft)
            return (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Total HT</span>
                  <span className="font-medium">{t.totalHT.toFixed(2)} €</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">TVA</Label>
                  <Select
                    value={draft.financier.tvaMode}
                    onValueChange={(v: TvaMode) =>
                      setDraft({
                        ...draft,
                        financier: { ...draft.financier, tvaMode: v },
                      })
                    }
                  >
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
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
                  <span className="text-white/80">Montant TVA</span>
                  <span className="font-medium">{t.montantTVA.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center rounded-lg border-2 border-[#1e3a5f] bg-[#1e3a5f]/20 px-4 py-3">
                  <span className="font-bold text-lg text-white">Total TTC</span>
                  <span className="font-bold text-2xl text-white">{t.totalTTC.toFixed(2)} €</span>
                </div>
              </>
            )
          })()}
          <div className="space-y-2">
            <Label htmlFor="modalites" className="text-white">Modalités de paiement</Label>
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
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="penalites" className="text-white">Pénalités de retard</Label>
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
              className="bg-black/20 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            rows={5}
            placeholder="Conditions générales, remarques…"
            className="bg-black/20 border-white/10 text-white"
          />
        </CardContent>
      </Card>
    </div>
  )
}
