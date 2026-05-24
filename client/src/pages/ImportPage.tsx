import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation } from "wouter"
import { PageWrapper } from "@/components/PageWrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import {
  clearStoredImports,
  formatEuro,
  loadStoredImports,
  removeStoredImport,
  saveStoredImport,
  type ExtractedInvoice,
  type StoredInvoiceImport,
} from "@/lib/invoiceImportStorage"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, CheckCircle2, FileText, Loader2, Upload, Wand2, X } from "lucide-react"

const MAX_FILES = 100
const MAX_BYTES = 10 * 1024 * 1024

type FileJob = {
  file: File
  status: "pending" | "uploading" | "done" | "error"
  message?: string
  extraction?: ExtractedInvoice
}

function fileToPdfBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result as string
      const b64 = r.replace(/^data:application\/pdf;base64,/, "")
      resolve(b64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function ImportPage() {
  const [, setLocation] = useLocation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<FileJob[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [importId, setImportId] = useState<string | null>(null)
  const [recentImports, setRecentImports] = useState<StoredInvoiceImport[]>(() => loadStoredImports())
  const [detailView, setDetailView] = useState<{ filename: string; extraction: ExtractedInvoice } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (localStorage.getItem("userType") === "team") {
      setLocation("/team-dashboard")
    }
  }, [setLocation])

  const onFilesPicked = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return
      const arr = Array.from(list).filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))
      if (arr.length === 0) {
        toast({ title: "Aucun PDF", description: "Sélectionnez uniquement des fichiers .pdf", variant: "destructive" })
        return
      }
      const tooBig = arr.find((f) => f.size > MAX_BYTES)
      if (tooBig) {
        toast({
          title: "Fichier trop volumineux",
          description: `Chaque PDF doit faire au plus ${MAX_BYTES / (1024 * 1024)} Mo (${tooBig.name}).`,
          variant: "destructive",
        })
        return
      }
      if (arr.length > MAX_FILES) {
        toast({
          title: "Trop de fichiers",
          description: `Maximum ${MAX_FILES} PDF par lot.`,
          variant: "destructive",
        })
        return
      }
      setImportId(null)
      setJobs(arr.map((file) => ({ file, status: "pending" as const })))
    },
    [toast],
  )

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onFilesPicked(e.dataTransfer.files)
    },
  }

  const analyzeWithLocalApi = async (file: File): Promise<ExtractedInvoice> => {
    const pdfBase64 = await fileToPdfBase64(file)
    const res = await fetch("/api/analyze-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf_base64: pdfBase64, filename: file.name }),
    })
    const data = (await res.json()) as {
      ok?: boolean
      extraction?: ExtractedInvoice
      message?: string
    }
    if (!res.ok || !data.ok || !data.extraction) {
      throw new Error(data.message ?? `Erreur ${res.status}`)
    }
    return data.extraction
  }

  const analyzeWithSupabase = async (
    file: File,
    impId: string,
  ): Promise<ExtractedInvoice> => {
    const pdfBase64 = await fileToPdfBase64(file)
    const { data, error: fnErr } = await supabase.functions.invoke("analyze-invoice", {
      body: {
        import_id: impId,
        pdf_base64: pdfBase64,
        filename: file.name,
      },
    })

    if (fnErr) throw new Error(fnErr.message)

    const body = data as { ok?: boolean; error?: string; extraction?: ExtractedInvoice }
    if (body?.ok === false) throw new Error(body.error ?? "Erreur Supabase")
    if (!body?.extraction) throw new Error("Extraction Supabase vide")
    return body.extraction
  }

  const runAnalysis = async () => {
    if (jobs.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Ajoutez au moins un PDF avant de lancer l'analyse.",
        variant: "destructive",
      })
      return
    }

    setAnalyzing(true)
    setImportId(null)

    let supabaseImportId: string | null = null
    if (user?.id) {
      const { data: imp, error: impErr } = await supabase
        .from("imports")
        .insert({
          user_id: user.id,
          type: "factures_pdf",
          status: "analyzing",
          total_files: jobs.length,
          total_processed: 0,
        })
        .select("id")
        .single()

      if (!impErr && imp) {
        supabaseImportId = imp.id
        setImportId(imp.id)
      }
    }

    let ok = 0
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, status: "uploading", message: undefined } : j)))

      try {
        let extraction: ExtractedInvoice
        try {
          if (supabaseImportId) {
            extraction = await analyzeWithSupabase(job.file, supabaseImportId)
          } else {
            throw new Error("Pas de session Supabase")
          }
        } catch {
          extraction = await analyzeWithLocalApi(job.file)
        }

        const stored: StoredInvoiceImport = {
          id: crypto.randomUUID(),
          filename: job.file.name,
          analyzedAt: new Date().toISOString(),
          extraction,
        }
        saveStoredImport(stored)

        ok++
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i ? { ...j, status: "done", extraction, message: undefined } : j,
          ),
        )
      } catch (e) {
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i
              ? { ...j, status: "error", message: (e as Error).message }
              : j,
          ),
        )
      }
    }

    if (supabaseImportId) {
      await supabase
        .from("imports")
        .update({ status: "awaiting_validation", total_processed: ok })
        .eq("id", supabaseImportId)
    }

    setRecentImports(loadStoredImports())
    setAnalyzing(false)

    if (ok === 0) {
      toast({
        title: "Analyse échouée",
        description: "Vérifiez ANTHROPIC_API_KEY dans .env et que le PDF est une facture lisible.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Analyse terminée",
      description: `${ok} / ${jobs.length} document(s) analysé(s) par Claude.`,
    })
  }

  const removeJob = (index: number) => {
    if (analyzing) return
    setJobs((prev) => prev.filter((_, idx) => idx !== index))
  }

  const removeRecentImport = (id: string) => {
    removeStoredImport(id)
    setRecentImports(loadStoredImports())
    toast({ title: "Extraction supprimée" })
  }

  const clearRecentImports = () => {
    clearStoredImports()
    setRecentImports([])
    toast({
      title: "Historique effacé",
      description: "Toutes les extractions enregistrées ont été supprimées.",
    })
  }

  const totalBytes = jobs.reduce((s, j) => s + j.file.size, 0)
  const doneCount = jobs.filter((j) => j.status === "done").length
  const progressPct = jobs.length ? Math.round((doneCount / jobs.length) * 100) : 0

  return (
    <PageWrapper>
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-gray-600 px-6 py-4 rounded-tl-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-900 dark:text-white shrink-0 hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={() => setLocation("/dashboard")}
              aria-label="Retour au dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Importer mes factures (IA)</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Déposez vos PDF — analyse par Claude, stockage sécurisé sur Supabase (région EU).
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-3xl">
        <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <CardTitle className="text-lg">Factures PDF</CardTitle>
            </div>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Jusqu&apos;à {MAX_FILES} fichiers, {MAX_BYTES / (1024 * 1024)} Mo chacun. L&apos;analyse utilise Claude
              intégré via <code className="text-xs text-gray-600 dark:text-gray-300">/api/analyze-invoice</code>{" "}
              (configurez <code className="text-xs text-gray-600 dark:text-gray-300">ANTHROPIC_API_KEY</code> dans{" "}
              <code className="text-xs text-gray-600 dark:text-gray-300">.env</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              {...dropHandlers}
              className="rounded-xl border border-dashed border-gray-300 dark:border-white/20 bg-black/20 px-6 py-10 text-center cursor-pointer hover:border-white/40 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-gray-500 dark:text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Glissez-déposez vos PDF ici ou cliquez pour parcourir</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  onFilesPicked(e.target.files)
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-1"
                onClick={() => fileInputRef.current?.click()}
              >
                Choisir des fichiers
              </Button>
            </div>

            {jobs.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>
                    {jobs.length} fichier{jobs.length > 1 ? "s" : ""} — {(totalBytes / (1024 * 1024)).toFixed(1)} Mo
                  </span>
                  {importId && <span className="font-mono text-xs truncate max-w-[200px]">Import {importId}</span>}
                </div>
                {analyzing && <Progress value={progressPct} className="h-2" />}
                <ul className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-gray-300 dark:border-gray-600 divide-y divide-white/5">
                  {jobs.map((j, i) => (
                    <li key={i} className="px-3 py-2 text-sm space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            disabled={analyzing || j.status === "uploading"}
                            onClick={() => removeJob(i)}
                            className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
                            aria-label={`Retirer ${j.file.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <FileText className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                          <span className="truncate text-gray-900 dark:text-white">{j.file.name}</span>
                        </span>
                        {j.status === "uploading" && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-300 shrink-0" />
                        )}
                        {j.status === "pending" && (
                          <Badge variant="secondary" className="shrink-0">
                            en attente
                          </Badge>
                        )}
                        {j.status === "done" && j.extraction && (
                          <Badge
                            role="button"
                            tabIndex={0}
                            title="Voir le détail de l'extraction"
                            className="shrink-0 bg-emerald-600/80 hover:bg-emerald-600 text-white cursor-pointer"
                            onClick={() =>
                              setDetailView({ filename: j.file.name, extraction: j.extraction! })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                setDetailView({ filename: j.file.name, extraction: j.extraction! })
                              }
                            }}
                          >
                            OK
                          </Badge>
                        )}
                        {j.status === "done" && !j.extraction && (
                          <Badge className="shrink-0 bg-emerald-600/80 hover:bg-emerald-600 text-white">
                            OK
                          </Badge>
                        )}
                        {j.status === "error" && (
                          <Badge
                            role="button"
                            tabIndex={0}
                            variant="destructive"
                            title={j.message ?? "Erreur"}
                            className="shrink-0 truncate max-w-[140px] cursor-pointer"
                            onClick={() =>
                              toast({
                                title: "Erreur d'analyse",
                                description: j.message ?? "Erreur inconnue",
                                variant: "destructive",
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                toast({
                                  title: "Erreur d'analyse",
                                  description: j.message ?? "Erreur inconnue",
                                  variant: "destructive",
                                })
                              }
                            }}
                          >
                            erreur
                          </Badge>
                        )}
                      </div>
                      {j.status === "error" && j.message && (
                        <p className="text-xs text-red-400 pl-6">{j.message}</p>
                      )}
                      {j.extraction && (
                        <ExtractionSummary extraction={j.extraction} />
                      )}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  disabled={analyzing || jobs.length === 0}
                  onClick={runAnalysis}
                  className="w-full bg-gray-100 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-white/30"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyse en cours…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Lancer l&apos;analyse IA
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {recentImports.length > 0 && (
          <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Dernières extractions
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Résultats enregistrés localement sur cet appareil.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentImports}
                  className="shrink-0 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  Tout effacer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentImports.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-black/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => removeRecentImport(item.id)}
                        className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                        aria-label={`Supprimer ${item.filename}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="font-medium text-sm truncate">{item.filename}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {new Date(item.analyzedAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <ExtractionSummary extraction={item.extraction} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white opacity-80">
          <CardHeader>
            <CardTitle className="text-base">Autres méthodes</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Import CSV et saisie manuelle arrivent dans une prochaine version.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="pb-8">
          <Link href="/dashboard">
            <Button type="button" variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gray-100 dark:bg-white/10">
              ← Retour au dashboard
            </Button>
          </Link>
        </div>
      </main>

      <ExtractionDetailDialog detail={detailView} onClose={() => setDetailView(null)} />
    </PageWrapper>
  )
}

function ExtractionSummary({ extraction }: { extraction: ExtractedInvoice }) {
  const client = extraction.client?.nom ?? "Client non identifié"
  const numero = extraction.facture?.numero ?? "—"
  const ttc = formatEuro(extraction.facture?.montant_ttc)
  const confidence = Math.round((extraction.confidence ?? 0) * 100)

  return (
    <div className="pl-6 space-y-1 text-xs text-gray-600 dark:text-gray-300">
      <p>
        <span className="text-gray-500 dark:text-gray-400">Client :</span>{" "}
        <span className="text-gray-900 dark:text-white">{client}</span>
      </p>
      <p>
        <span className="text-gray-500 dark:text-gray-400">N° facture :</span> {numero}
        {" · "}
        <span className="text-gray-500 dark:text-gray-400">TTC :</span>{" "}
        <span className="font-semibold text-[#F97316]">{ttc}</span>
      </p>
      <p>
        <span className="text-gray-500 dark:text-gray-400">Confiance IA :</span> {confidence}%
        {extraction.remarques ? ` — ${extraction.remarques}` : ""}
      </p>
    </div>
  )
}

function ExtractionDetailDialog({
  detail,
  onClose,
}: {
  detail: { filename: string; extraction: ExtractedInvoice } | null
  onClose: () => void
}) {
  if (!detail) return null

  const { filename, extraction: e } = detail
  const confidence = Math.round((e.confidence ?? 0) * 100)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            Extraction réussie
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 truncate">
            {filename}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <section className="space-y-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">Client</h3>
            <p>{e.client?.nom ?? "—"}</p>
            {e.client?.email && <p className="text-gray-600 dark:text-gray-300">{e.client.email}</p>}
            {e.client?.telephone && <p className="text-gray-600 dark:text-gray-300">{e.client.telephone}</p>}
            {(e.client?.adresse || e.client?.ville) && (
              <p className="text-gray-600 dark:text-gray-300">
                {[e.client.adresse, e.client.code_postal, e.client.ville].filter(Boolean).join(", ")}
              </p>
            )}
          </section>

          <section className="space-y-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">Facture</h3>
            <p>N° {e.facture?.numero ?? "—"}</p>
            <p className="text-gray-600 dark:text-gray-300">
              Émission : {e.facture?.date_emission ?? "—"}
              {e.facture?.date_prestation ? ` · Prestation : ${e.facture.date_prestation}` : ""}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <span>HT : {formatEuro(e.facture?.montant_ht)}</span>
              <span>TVA : {formatEuro(e.facture?.montant_tva)}</span>
              <span className="font-bold text-[#F97316]">TTC : {formatEuro(e.facture?.montant_ttc)}</span>
            </div>
          </section>

          {e.lignes.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Lignes ({e.lignes.length})
              </h3>
              <ul className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-gray-300 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
                {e.lignes.map((l, idx) => (
                  <li key={idx} className="px-3 py-2 text-xs flex justify-between gap-2">
                    <span className="truncate">{l.designation}</span>
                    <span className="shrink-0 tabular-nums">{formatEuro(l.montant_ht)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Confiance IA : {confidence}%
            {e.champs_incertains?.length
              ? ` · Champs incertains : ${e.champs_incertains.join(", ")}`
              : ""}
            {e.remarques ? ` · ${e.remarques}` : ""}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
