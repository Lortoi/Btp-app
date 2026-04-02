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
    nom: "Jean Dupont",
    entreprise: "Entreprise ABC",
    email: "jean.dupont@example.com",
    telephone: "06 12 34 56 78",
    typeTravaux: "Rénovation cuisine",
    montantEstime: 18500,
    dateContact: "2026-03-15",
    colonne: "Prospect",
    priorite: "haute",
  },
  {
    id: "2",
    nom: "Marie Martin",
    entreprise: "Particulier",
    email: "marie.martin@email.com",
    telephone: "06 98 76 54 32",
    typeTravaux: "Extension maison",
    montantEstime: 45000,
    dateContact: "2026-03-22",
    colonne: "Visite chantier",
    priorite: "haute",
  },
  {
    id: "3",
    nom: "SCI Les Pins",
    entreprise: "SCI Les Pins",
    email: "contact@lespins.fr",
    telephone: "01 23 45 67 89",
    typeTravaux: "Maçonnerie résidence",
    montantEstime: 92000,
    dateContact: "2026-03-10",
    colonne: "Devis envoyé",
    priorite: "haute",
  },
  {
    id: "4",
    nom: "Pierre Leroy",
    entreprise: "Particulier",
    email: "p.leroy@gmail.com",
    telephone: "06 44 55 66 77",
    typeTravaux: "Ravalement façade",
    montantEstime: 12000,
    dateContact: "2026-02-28",
    colonne: "Devis accepté",
    priorite: "normale",
  },
  {
    id: "5",
    nom: "Immeuble Voltaire",
    entreprise: "Syndic Voltaire",
    email: "syndic@voltaire.fr",
    telephone: "01 55 66 77 88",
    typeTravaux: "Plomberie collective",
    montantEstime: 28000,
    dateContact: "2026-02-10",
    colonne: "En chantier",
    priorite: "normale",
  },
  {
    id: "6",
    nom: "Cabinet Rousseau",
    entreprise: "Cabinet Rousseau",
    email: "rousseau@cabinet.fr",
    telephone: "06 22 33 44 55",
    typeTravaux: "Aménagement bureaux",
    montantEstime: 35000,
    dateContact: "2026-01-15",
    colonne: "Facturé",
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
              <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white h-full flex flex-col">
                <CardHeader className="pb-2 space-y-0">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-snug">{titre}</CardTitle>
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-white/10 text-white border border-white/10"
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
                        className={`rounded-lg border border-white/10 bg-black/25 backdrop-blur-sm p-3 text-white ${
                          p.priorite === "haute" ? "border-l-[3px] border-l-[#F97316]" : ""
                        }`}
                      >
                        <div className="space-y-2">
                          <div>
                            <p className="font-bold text-sm leading-tight">{p.nom}</p>
                            <p className="text-xs text-white/65 mt-0.5">{p.entreprise}</p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-white/10 text-white/95 text-xs font-normal border-0"
                          >
                            {p.typeTravaux}
                          </Badge>
                          <p className="text-sm font-bold text-[#F97316]">{formatMontantEUR(p.montantEstime)}</p>
                          <div className="flex items-center gap-1.5 text-xs text-white/80">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-white/55" aria-hidden />
                            <span>{p.telephone}</span>
                          </div>
                          <p className="text-xs text-white/50">{formatContactLabel(p.dateContact)}</p>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-white/45 text-center py-6">Aucun prospect</p>
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
