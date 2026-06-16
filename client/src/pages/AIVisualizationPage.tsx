import { useState, useRef } from "react"
import { useLocation } from "wouter"
import { PageWrapper } from "@/components/PageWrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Download,
  RefreshCw,
  CheckCircle,
  FileText,
  Clock,
  Hammer,
  Package,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCardHover } from '@/hooks/useCardHover'
import {
  CHANTIER_WORK_TYPES,
  workTypeLabel,
  type ChantierVisionReport,
  type ChantierWorkType,
} from "@shared/chantierVisionTypes"
import { exportChantierReportPdf } from "@/lib/chantierVisionExport"
import {
  SAVED_QUOTES_KEY,
  SAVED_QUOTES_SELECTED_ID_KEY,
  createDefaultDraft,
  nextQuoteNumber,
  type QuoteDraft,
  type SavedQuote,
} from "@/components/quotes/quoteTypes"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

type AcceptedMediaType = (typeof ACCEPTED_TYPES)[number]

interface UploadedImage {
  file: File
  preview: string
  mediaType: AcceptedMediaType
}

type Step = "upload" | "configure" | "generating" | "result"

function isAcceptedMediaType(type: string): type is AcceptedMediaType {
  return (ACCEPTED_TYPES as readonly string[]).includes(type)
}

export default function AIVisualizationPage() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const { getHoverProps, getHoverStyle } = useCardHover()
  const [step, setStep] = useState<Step>("upload")
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [selectedWorkType, setSelectedWorkType] = useState<ChantierWorkType | "">("")
  const [customWorkType, setCustomWorkType] = useState("")
  const [goalDescription, setGoalDescription] = useState("")
  const [report, setReport] = useState<ChantierVisionReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolvedWorkLabel = selectedWorkType
    ? workTypeLabel(selectedWorkType, customWorkType)
    : ""

  const canGenerate =
    !!uploadedImage &&
    !!selectedWorkType &&
    goalDescription.trim().length >= 10 &&
    (selectedWorkType !== "autre" || customWorkType.trim().length >= 3)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAcceptedMediaType(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Utilisez JPG, PNG ou WEBP.",
        variant: "destructive",
      })
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 10 Mo.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    const mediaType = file.type as AcceptedMediaType
    reader.onload = (e) => {
      setUploadedImage({
        file,
        preview: e.target?.result as string,
        mediaType,
      })
      setReport(null)
      setError(null)
      setStep("configure")
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const generateReport = async () => {
    if (!uploadedImage || !selectedWorkType || !canGenerate) return

    setStep("generating")
    setError(null)
    setReport(null)

    try {
      const res = await fetch("/api/analyze-chantier-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: uploadedImage.preview,
          media_type: uploadedImage.mediaType,
          work_type_label: resolvedWorkLabel,
          goal_description: goalDescription.trim(),
        }),
      })

      const data = (await res.json()) as {
        ok?: boolean
        report?: ChantierVisionReport
        message?: string
      }

      if (!res.ok || !data.ok || !data.report) {
        throw new Error(data.message ?? "Analyse impossible")
      }

      setReport(data.report)
      setStep("result")
      toast({
        title: "Rapport généré",
        description: "Claude a analysé votre photo de chantier.",
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue"
      setError(message)
      setStep("configure")
      toast({
        title: "Échec de l'analyse",
        description: message,
        variant: "destructive",
      })
    }
  }

  const resetProcess = () => {
    setStep("upload")
    setUploadedImage(null)
    setSelectedWorkType("")
    setCustomWorkType("")
    setGoalDescription("")
    setReport(null)
    setError(null)
  }

  const handleExportPdf = () => {
    if (!report) return
    exportChantierReportPdf({
      report,
      workTypeLabel: resolvedWorkLabel,
      goalDescription: goalDescription.trim(),
      imageDataUrl: uploadedImage?.preview,
    })
  }

  const handleCreateQuote = () => {
    if (!report) return

    const draftBase = createDefaultDraft()
    const numero = nextQuoteNumber()

    const lignes = report.lignes_devis.map((l) => ({
      id: crypto.randomUUID(),
      description: l.description,
      quantity: l.quantity,
      unite: l.unite,
      puHT: l.puHT,
    }))

    const draft: QuoteDraft = {
      ...draftBase,
      devis: { ...draftBase.devis, numero },
      lignes: lignes.length > 0 ? lignes : draftBase.lignes,
      notes: [
        `Visualisation IA — ${resolvedWorkLabel}`,
        `Objectif : ${goalDescription.trim()}`,
        "",
        report.description_rendu,
        "",
        `Durée estimée : ${report.estimation_temps}`,
        report.travaux_necessaires.length
          ? `Travaux : ${report.travaux_necessaires.join(" · ")}`
          : null,
        report.recommandations_materiaux.length
          ? `Matériaux : ${report.recommandations_materiaux.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
    }

    const saved: SavedQuote = {
      id: crypto.randomUUID(),
      numero,
      clientNom: "Client chantier",
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

    toast({
      title: "Devis pré-rempli",
      description: "Redirection vers le générateur de devis…",
    })
    setLocation("/dashboard/quotes")
  }

  const stepBadge = (s: Step, label: string) => (
    <Badge
      variant={step === s ? "default" : "secondary"}
      className={
        step === s
          ? "bg-ai hover:bg-ai text-white border-ai"
          : "border-ai/20"
      }
    >
      {label}
    </Badge>
  )

  return (
    <PageWrapper>
      <header className="surface-header backdrop-blur-sm border-b border-ai/25 px-6 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full max-w-full">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Visualisation IA
            </h1>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap max-w-full">
            {stepBadge("upload", "1. Upload")}
            {stepBadge("configure", "2. Configuration")}
            {stepBadge("generating", "3. Génération")}
            {stepBadge("result", "4. Résultat")}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-x-hidden w-full max-w-full">
        {step === "upload" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card
              className="ai-surface-card backdrop-blur-sm text-foreground hover-elevate"
              {...getHoverProps('ai_vis_upload')}
              style={getHoverStyle('ai_vis_upload', '#f59e0b')}
            >
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto rounded-xl bg-ai/10 backdrop-blur-md border border-ai/30 flex items-center justify-center mb-4">
                  <ImageIcon className="h-8 w-8 text-ai-light" />
                </div>
                <CardTitle>Uploadez une photo du chantier</CardTitle>
                <p className="text-subtitle">
                  Photo claire de l&apos;espace à rénover pour une analyse précise
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-ai/30 rounded-lg p-8 text-center hover:border-ai-light/60 transition-colors cursor-pointer bg-ai-muted dark:bg-ai-muted"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="upload-zone"
                >
                  <Upload className="h-12 w-12 mx-auto text-ai-light mb-4" />
                  <p className="text-lg font-medium mb-2 text-foreground">
                    Cliquez pour sélectionner une photo
                  </p>
                  <p className="text-sm text-subtitle">
                    JPG, PNG, WEBP · Max 10 Mo
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="file-input"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {step === "configure" && uploadedImage && (
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card
                className="ai-surface-card backdrop-blur-sm text-foreground hover-elevate"
                {...getHoverProps('ai_vis_photo')}
                style={getHoverStyle('ai_vis_photo', '#f59e0b')}
              >
                <CardHeader>
                  <CardTitle>Photo du chantier</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={uploadedImage.preview}
                    alt="Chantier"
                    className="w-full h-64 object-cover rounded-lg border border-ai/20"
                    data-testid="uploaded-image-preview"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-ai/30"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-change-image"
                  >
                    Changer d&apos;image
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card
                  className="ai-surface-card backdrop-blur-sm text-foreground hover-elevate"
                  {...getHoverProps('ai_vis_work_type')}
                  style={getHoverStyle('ai_vis_work_type', '#7c3aed')}
                >
                  <CardHeader>
                    <CardTitle>Type de travaux</CardTitle>
                    <p className="text-sm text-subtitle">
                      Sélectionnez le corps de métier concerné
                    </p>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-3">
                    {CHANTIER_WORK_TYPES.map((type) => (
                      <div
                        key={type.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all text-foreground ${
                          selectedWorkType === type.id
                            ? "border-ai bg-ai/10"
                            : "border-ai/20 hover:border-ai-light/50 bg-ai-muted"
                        }`}
                        onClick={() => setSelectedWorkType(type.id)}
                        data-testid={`work-type-${type.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{type.icon}</span>
                          <h4 className="font-medium">{type.label}</h4>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {selectedWorkType === "autre" && (
                  <Card
                    className="ai-surface-card backdrop-blur-sm text-foreground"
                    {...getHoverProps('ai_vis_custom_work')}
                    style={getHoverStyle('ai_vis_custom_work', '#7c3aed')}
                  >
                    <CardContent className="pt-6">
                      <Label htmlFor="custom-work">Précisez le type de travaux</Label>
                      <Input
                        id="custom-work"
                        value={customWorkType}
                        onChange={(e) => setCustomWorkType(e.target.value)}
                        placeholder="Ex : Rénovation combles, extension…"
                        className="mt-2 border-ai/30"
                        data-testid="input-custom-work"
                      />
                    </CardContent>
                  </Card>
                )}

                {selectedWorkType && (
                  <Card
                    className="ai-surface-card backdrop-blur-sm text-foreground hover-elevate"
                    {...getHoverProps('ai_vis_goal')}
                    style={getHoverStyle('ai_vis_goal', '#7c3aed')}
                  >
                    <CardHeader>
                      <CardTitle>Objectif en une phrase</CardTitle>
                      <p className="text-sm text-subtitle">
                        Décrivez le rendu final souhaité (min. 10 caractères)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={goalDescription}
                        onChange={(e) => setGoalDescription(e.target.value)}
                        placeholder="Ex : Cuisine ouverte moderne avec îlot central et plan de travail quartz blanc"
                        rows={3}
                        className="border-ai/30 resize-none"
                        data-testid="input-goal"
                      />
                    </CardContent>
                  </Card>
                )}

                {selectedWorkType && (
                  <Button
                    className="w-full bg-ai hover:bg-ai text-white"
                    onClick={generateReport}
                    disabled={!canGenerate}
                    data-testid="button-generate"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer le rapport IA
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card
              className="hover-elevate text-center ai-surface-card backdrop-blur-sm"
              {...getHoverProps('ai_vis_generating')}
              style={getHoverStyle('ai_vis_generating', '#7c3aed')}
            >
              <CardHeader>
                <div className="w-16 h-16 mx-auto rounded-xl bg-ai/10 border border-ai/30 flex items-center justify-center mb-4">
                  <RefreshCw className="h-8 w-8 text-ai-light animate-spin" />
                </div>
                <CardTitle>Analyse en cours…</CardTitle>
                <p className="text-subtitle">
                  Claude analyse votre photo et rédige le rapport professionnel
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-2 w-full rounded-full bg-neutral-950/30 overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-ai animate-pulse" />
                </div>
                <p className="text-sm text-secondary">
                  Analyse visuelle · Estimation travaux · Recommandations matériaux
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "result" && uploadedImage && report && (
          <div className="max-w-6xl mx-auto space-y-6">
            <Card
              className="ai-surface-card backdrop-blur-sm text-foreground hover-elevate"
              {...getHoverProps('ai_vis_result')}
              style={getHoverStyle('ai_vis_result', '#7c3aed')}
            >
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-ai-light shrink-0" />
                  <CardTitle>Rapport généré avec succès</CardTitle>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-ai/30"
                    onClick={handleExportPdf}
                    data-testid="button-export-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter en PDF
                  </Button>
                  <Button
                    size="sm"
                    className="bg-ai hover:bg-ai text-white"
                    onClick={handleCreateQuote}
                    data-testid="button-create-quote"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Créer un devis depuis ce rapport
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-ai/30"
                    onClick={resetProcess}
                    data-testid="button-new-render"
                  >
                    Nouvelle analyse
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-ai-light" />
                      Photo analysée
                    </h3>
                    <img
                      src={uploadedImage.preview}
                      alt="Chantier"
                      className="w-full h-56 object-cover rounded-lg border border-ai/20"
                      data-testid="before-image"
                    />
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-subtitle">Travaux :</span>{" "}
                        <span className="font-medium">{resolvedWorkLabel}</span>
                      </p>
                      <p>
                        <span className="text-subtitle">Objectif :</span>{" "}
                        <span className="font-medium">{goalDescription.trim()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <section className="p-4 rounded-lg bg-ai-muted border border-ai/20">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-ai-light">
                        <Sparkles className="h-4 w-4" />
                        Description du rendu final
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {report.description_rendu}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <section className="p-4 rounded-lg bg-ai-muted border border-ai/20">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Hammer className="h-4 w-4 text-ai-light" />
                          Travaux nécessaires
                        </h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-200">
                          {report.travaux_necessaires.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ol>
                      </section>

                      <section className="p-4 rounded-lg bg-ai-muted border border-ai/20">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-ai-light" />
                          Durée de chantier
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {report.estimation_temps}
                        </p>

                        <h3 className="font-semibold mt-4 mb-2 flex items-center gap-2">
                          <Package className="h-4 w-4 text-ai-light" />
                          Matériaux recommandés
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-200">
                          {report.recommandations_materiaux.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                </div>

                {report.lignes_devis.length > 0 && (
                  <section className="p-4 rounded-lg bg-ai-muted border border-ai/20">
                    <h3 className="font-semibold mb-3">Estimation devis (HT)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-ai/20 text-left text-subtitle">
                            <th className="py-2 pr-4">Prestation</th>
                            <th className="py-2 pr-4">Qté</th>
                            <th className="py-2 pr-4">Unité</th>
                            <th className="py-2 text-right">PU HT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.lignes_devis.map((l, i) => (
                            <tr key={i} className="border-b border-ai/10">
                              <td className="py-2 pr-4">{l.description}</td>
                              <td className="py-2 pr-4">{l.quantity}</td>
                              <td className="py-2 pr-4">{l.unite}</td>
                              <td className="py-2 text-right">
                                {l.puHT.toLocaleString("fr-FR")} €
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </main>
    </PageWrapper>
  )
}
