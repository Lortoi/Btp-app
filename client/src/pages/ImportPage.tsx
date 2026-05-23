import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation } from "wouter"
import { PageWrapper } from "@/components/PageWrapper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, FileText, Loader2, Upload, Wand2 } from "lucide-react"

const MAX_FILES = 100
const MAX_BYTES = 10 * 1024 * 1024

type FileJob = {
  file: File
  status: "pending" | "uploading" | "done" | "error"
  message?: string
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

  const runAnalysis = async () => {
    if (!user?.id || jobs.length === 0) return
    setAnalyzing(true)
    setImportId(null)

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

    if (impErr || !imp) {
      setAnalyzing(false)
      toast({
        title: "Impossible de démarrer l'import",
        description: impErr?.message ?? "Vérifiez que la migration SQL a bien été appliquée sur Supabase.",
        variant: "destructive",
      })
      return
    }

    setImportId(imp.id)

    let ok = 0
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, status: "uploading" } : j)))

      try {
        const pdfBase64 = await fileToPdfBase64(job.file)
        const { data, error: fnErr } = await supabase.functions.invoke("analyze-invoice", {
          body: {
            import_id: imp.id,
            pdf_base64: pdfBase64,
            filename: job.file.name,
          },
        })

        if (fnErr) {
          setJobs((prev) =>
            prev.map((j, idx) => (idx === i ? { ...j, status: "error", message: fnErr.message } : j)),
          )
          continue
        }

        const body = data as { ok?: boolean; error?: string }
        if (body && body.ok === false) {
          setJobs((prev) =>
            prev.map((j, idx) => (idx === i ? { ...j, status: "error", message: body.error ?? "Erreur" } : j)),
          )
          continue
        }

        ok++
        setJobs((prev) => prev.map((j, idx) => (idx === i ? { ...j, status: "done" } : j)))
      } catch (e) {
        setJobs((prev) =>
          prev.map((j, idx) =>
            idx === i ? { ...j, status: "error", message: (e as Error).message } : j,
          ),
        )
      }
    }

    await supabase.from("imports").update({ status: "awaiting_validation" }).eq("id", imp.id)

    setAnalyzing(false)
    toast({
      title: "Analyse terminée",
      description: `${ok} / ${jobs.length} facture(s) extraites. Prochaine étape : écran de validation (à venir).`,
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
              Jusqu&apos;à {MAX_FILES} fichiers, {MAX_BYTES / (1024 * 1024)} Mo chacun. L&apos; Edge Function{" "}
              <code className="text-xs text-gray-600 dark:text-gray-300">analyze-invoice</code> doit être déployée et{" "}
              <code className="text-xs text-gray-600 dark:text-gray-300">ANTHROPIC_API_KEY</code> configurée côté Supabase.
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
                    <li key={i} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span className="truncate flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                        <span className="truncate text-gray-900 dark:text-white">{j.file.name}</span>
                      </span>
                      {j.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-300 shrink-0" />}
                      {j.status === "pending" && (
                        <Badge variant="secondary" className="shrink-0">
                          en attente
                        </Badge>
                      )}
                      {j.status === "done" && (
                        <Badge className="shrink-0 bg-emerald-600/80 hover:bg-emerald-600">OK</Badge>
                      )}
                      {j.status === "error" && (
                        <Badge variant="destructive" className="shrink-0 truncate max-w-[140px]" title={j.message}>
                          erreur
                        </Badge>
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
    </PageWrapper>
  )
}
