import { useCallback, useEffect, useState } from "react"
import { PageWrapper } from "@/components/PageWrapper"
import {
  CRMPipeline,
  mockProspects,
  mapCrmRowsToProspects,
  PIPELINE_COLONNES,
  type MockProspect,
  type ColonnePipeline,
} from "@/components/CRMPipeline"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createCrmProspect,
  fetchCrmProspects,
  type CrmProspectColonne,
} from "@/lib/supabase"

const CLIENT_TYPES = ["Particulier", "Professionnel", "SCI"] as const

type ClientType = (typeof CLIENT_TYPES)[number]

const defaultForm = {
  nom: "",
  type: "Particulier" as ClientType,
  travaux: "",
  montant: "",
  telephone: "",
  statut: "Prospect" as ColonnePipeline,
}

export default function CRMPipelinePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [prospects, setProspects] = useState<MockProspect[]>(mockProspects)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const loadProspects = useCallback(async (opts?: { fallbackMock?: boolean }) => {
    const rows = await fetchCrmProspects()
    if (rows.length > 0) {
      setProspects(mapCrmRowsToProspects(rows))
    } else if (opts?.fallbackMock !== false) {
      setProspects(mockProspects)
    } else {
      setProspects([])
    }
  }, [])

  useEffect(() => {
    void loadProspects()
  }, [loadProspects])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) return

    setSubmitting(true)
    try {
      const created = await createCrmProspect({
        nom: form.nom.trim(),
        entreprise: form.type,
        type_travaux: form.travaux.trim(),
        montant_estime: Number(form.montant) || 0,
        telephone: form.telephone.trim(),
        colonne: form.statut as CrmProspectColonne,
      })

      if (created) {
        setIsModalOpen(false)
        setForm(defaultForm)
        await loadProspects({ fallbackMock: false })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper>
      <header
        className="bg-white/80 dark:bg-[#080d1a]/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 rounded-tl-3xl"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 className="text-2xl font-bold text-foreground">CRM Pipeline</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))",
            border: "1px solid rgba(124,58,237,0.4)",
            borderRadius: "10px",
            padding: "8px 16px",
            color: "#a78bfa",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.8)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
          Ajouter un prospect
        </button>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden w-full max-w-full">
        <CRMPipeline prospects={prospects} />
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="surface-card backdrop-blur-sm text-foreground rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ajouter un prospect</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="prospect-nom" className="text-foreground">
                Nom complet
              </Label>
              <Input
                id="prospect-nom"
                required
                value={form.nom}
                onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
                placeholder="Sophie Bernard"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect-type" className="text-foreground">
                Type
              </Label>
              <Select
                value={form.type}
                onValueChange={(value: ClientType) =>
                  setForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger id="prospect-type">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect-travaux" className="text-foreground">
                Travaux
              </Label>
              <Input
                id="prospect-travaux"
                value={form.travaux}
                onChange={(e) => setForm((prev) => ({ ...prev, travaux: e.target.value }))}
                placeholder="Rénovation salle de bain"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect-montant" className="text-foreground">
                Montant estimé €
              </Label>
              <Input
                id="prospect-montant"
                type="number"
                min={0}
                value={form.montant}
                onChange={(e) => setForm((prev) => ({ ...prev, montant: e.target.value }))}
                placeholder="18500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect-telephone" className="text-foreground">
                Téléphone
              </Label>
              <Input
                id="prospect-telephone"
                value={form.telephone}
                onChange={(e) => setForm((prev) => ({ ...prev, telephone: e.target.value }))}
                placeholder="06 14 25 36 47"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect-statut" className="text-foreground">
                Statut initial
              </Label>
              <Select
                value={form.statut}
                onValueChange={(value: ColonnePipeline) =>
                  setForm((prev) => ({ ...prev, statut: value }))
                }
              >
                <SelectTrigger id="prospect-statut">
                  <SelectValue placeholder="Choisir un statut" />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_COLONNES.map((statut) => (
                    <SelectItem key={statut} value={statut}>
                      {statut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 500,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Enregistrement…" : "Ajouter le prospect"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  )
}
