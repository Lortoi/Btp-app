import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone } from "lucide-react"

export type ColonnePipeline =
  | "Prospect"
  | "Visite chantier"
  | "Devis envoyé"
  | "Devis accepté"
  | "En chantier"
  | "Facturé"

export interface MockProspect {
  id: string
  nom: string
  entreprise: string
  email: string
  telephone: string
  typeTravaux: string
  montantEstime: number
  dateContact: string
  colonne: ColonnePipeline
  priorite: "haute" | "normale"
}

export const mockProspects: MockProspect[] = [
  {
    id: "1",
    nom: "Sophie Bernard",
    entreprise: "Particulier",
    email: "sophie.bernard@gmail.com",
    telephone: "06 14 25 36 47",
    typeTravaux: "Rénovation salle de bain",
    montantEstime: 18500,
    dateContact: "2026-04-02",
    colonne: "Prospect",
    priorite: "haute",
  },
  {
    id: "2",
    nom: "Marie Martin",
    entreprise: "Particulier",
    email: "marie.martin@email.com",
    telephone: "07 68 92 15 03",
    typeTravaux: "Extension maison",
    montantEstime: 42000,
    dateContact: "2026-03-18",
    colonne: "Visite chantier",
    priorite: "haute",
  },
  {
    id: "3",
    nom: "Pierre Leroy",
    entreprise: "Particulier",
    email: "p.leroy@gmail.com",
    telephone: "06 82 41 67 90",
    typeTravaux: "Ravalement façade",
    montantEstime: 32000,
    dateContact: "2026-03-25",
    colonne: "Devis envoyé",
    priorite: "haute",
  },
  {
    id: "4",
    nom: "SCI Les Pins",
    entreprise: "SCI Les Pins",
    email: "contact@lespins.fr",
    telephone: "01 45 72 33 18",
    typeTravaux: "Réfection toiture",
    montantEstime: 28000,
    dateContact: "2026-03-10",
    colonne: "Devis accepté",
    priorite: "normale",
  },
  {
    id: "5",
    nom: "Caroline Roche",
    entreprise: "Particulier",
    email: "caroline.roche@orange.fr",
    telephone: "06 73 58 12 44",
    typeTravaux: "Carrelage cuisine",
    montantEstime: 8500,
    dateContact: "2026-02-20",
    colonne: "En chantier",
    priorite: "normale",
  },
]

const COLONNES: { id: ColonnePipeline; titre: string }[] = [
  { id: "Prospect", titre: "📋 Prospect" },
  { id: "Visite chantier", titre: "🔍 Visite chantier" },
  { id: "Devis envoyé", titre: "📄 Devis envoyé" },
  { id: "Devis accepté", titre: "✅ Devis accepté" },
  { id: "En chantier", titre: "🏗️ En chantier" },
  { id: "Facturé", titre: "💰 Facturé" },
]

function formatMontantEUR(montant: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(montant) + " €"
  )
}

function formatContactLabel(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number)
  if (!y || !m || !d) return `Contact : ${dateIso}`
  const date = new Date(y, m - 1, d)
  const day = date.getDate()
  const month = date.toLocaleDateString("fr-FR", { month: "long" })
  return `Contact : ${day} ${month}`
}

function prospectsPourColonne(colonne: ColonnePipeline): MockProspect[] {
  return mockProspects.filter((p) => p.colonne === colonne)
}

export function CRMPipeline() {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 md:flex-row md:overflow-x-auto md:pb-2 md:gap-3">
        {COLONNES.map(({ id, titre }) => {
          const items = prospectsPourColonne(id)
          return (
            <div
              key={id}
              className="w-full shrink-0 md:min-w-[280px] md:w-[280px]"
            >
              <Card className="surface-card backdrop-blur-sm text-foreground h-full flex flex-col">
                <CardHeader className="pb-2 space-y-0">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-snug">{titre}</CardTitle>
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-gray-100 dark:bg-white/10 text-foreground border border-border"
                    >
                      {items.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-0">
                  <div className="min-h-[120px] space-y-2">
                    {items.map((p) => (
                      <div
                        key={p.id}
                        className={`rounded-lg border border-border bg-gray-50 dark:bg-black/25 backdrop-blur-sm p-3 text-foreground ${
                          p.priorite === "haute" ? "border-l-[3px] border-l-[#F5A623]" : ""
                        }`}
                      >
                        <div className="space-y-2">
                          <div>
                            <p className="font-bold text-sm leading-tight text-foreground">{p.nom}</p>
                            <p className="text-xs text-secondary mt-0.5">{p.entreprise}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-normal border border-gray-200 dark:border-transparent"
                          >
                            {p.typeTravaux}
                          </Badge>
                          <p className="text-sm font-bold text-[#F5A623]">{formatMontantEUR(p.montantEstime)}</p>
                          <div className="flex items-center gap-1.5 text-xs text-subtitle">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
                            <span>{p.telephone}</span>
                          </div>
                          <p className="text-xs text-secondary">{formatContactLabel(p.dateContact)}</p>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-secondary text-center py-6">Aucun prospect</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
