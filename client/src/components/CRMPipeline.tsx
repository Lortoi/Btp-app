import { useState } from "react"
import {
  ClipboardList,
  Search,
  FileText,
  CheckCircle2,
  HardHat,
  Receipt,
  Phone,
  type LucideIcon,
} from "lucide-react"

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

const STATUT_CONFIG: Record<
  ColonnePipeline,
  { icon: LucideIcon; label: string; color: string; bg: string }
> = {
  Prospect: { icon: ClipboardList, label: "Prospect", color: "#378ADD", bg: "#E6F1FB" },
  "Visite chantier": { icon: Search, label: "Visite chantier", color: "#EF9F27", bg: "#FAEEDA" },
  "Devis envoyé": { icon: FileText, label: "Devis envoyé", color: "#7F77DD", bg: "#EEEDFE" },
  "Devis accepté": { icon: CheckCircle2, label: "Devis accepté", color: "#639922", bg: "#EAF3DE" },
  "En chantier": { icon: HardHat, label: "En chantier", color: "#D85A30", bg: "#FAECE7" },
  Facturé: { icon: Receipt, label: "Facturé", color: "#888780", bg: "#F1EFE8" },
}

const COLONNES: ColonnePipeline[] = [
  "Prospect",
  "Visite chantier",
  "Devis envoyé",
  "Devis accepté",
  "En chantier",
  "Facturé",
]

export { COLONNES as PIPELINE_COLONNES }

function mapRowToProspect(row: {
  id: string
  nom: string
  entreprise: string
  email: string | null
  telephone: string | null
  type_travaux: string | null
  montant_estime: number | null
  date_contact: string
  colonne: string
  priorite: string
}): MockProspect {
  return {
    id: row.id,
    nom: row.nom,
    entreprise: row.entreprise,
    email: row.email ?? "",
    telephone: row.telephone ?? "",
    typeTravaux: row.type_travaux ?? "",
    montantEstime: Number(row.montant_estime ?? 0),
    dateContact: row.date_contact?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    colonne: row.colonne as ColonnePipeline,
    priorite: (row.priorite === "haute" ? "haute" : "normale") as MockProspect["priorite"],
  }
}

export function mapCrmRowsToProspects(
  rows: Parameters<typeof mapRowToProspect>[0][],
): MockProspect[] {
  return rows.map(mapRowToProspect)
}

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

function getInitials(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function prospectsPourColonne(colonne: ColonnePipeline, prospects: MockProspect[]): MockProspect[] {
  return prospects.filter((p) => p.colonne === colonne)
}

function totalMontantColonne(items: MockProspect[]): number {
  return items.reduce((sum, p) => sum + p.montantEstime, 0)
}

interface ProspectCardProps {
  prospect: MockProspect
  color: string
  bg: string
}

function ProspectCard({ prospect, color, bg }: ProspectCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        minWidth: "260px",
        flex: 1,
        transition: "transform 0.18s ease, border-color 0.18s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: color,
          borderRadius: "4px 0 0 4px",
        }}
      />

      <div style={{ paddingLeft: "10px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: bg,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getInitials(prospect.nom)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{prospect.nom}</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", margin: "2px 0 0", lineHeight: 1.3 }}>
              {prospect.entreprise}
            </p>
          </div>
        </div>

        <span
          style={{
            alignSelf: "flex-start",
            fontSize: "11px",
            fontWeight: 500,
            padding: "4px 10px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          {prospect.typeTravaux}
        </span>

        <p style={{ fontSize: "20px", fontWeight: 500, margin: 0, color }}>{formatMontantEUR(prospect.montantEstime)}</p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            paddingTop: "12px",
            borderTop: "0.5px solid rgba(255,255,255,0.08)",
            fontSize: "12px",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          <span>{formatContactLabel(prospect.dateContact)}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Phone style={{ width: "13px", height: "13px", flexShrink: 0 }} aria-hidden />
            {prospect.telephone}
          </span>
        </div>
      </div>
    </div>
  )
}

export function CRMPipeline({ prospects }: { prospects: MockProspect[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        width: "100%",
        maxWidth: "100%",
      }}
    >
      {COLONNES.map((colonne) => {
        const config = STATUT_CONFIG[colonne]
        const items = prospectsPourColonne(colonne, prospects)
        const total = totalMontantColonne(items)
        const Icon = config.icon

        return (
          <section key={colonne}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  color: config.color,
                }}
              >
                <Icon style={{ width: "16px", height: "16px", flexShrink: 0 }} aria-hidden />
                <span>{config.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    background: config.bg,
                    color: config.color,
                  }}
                >
                  {items.length}
                </span>
              </div>

              <div
                aria-hidden
                style={{
                  flex: 1,
                  height: "0.5px",
                  background: "rgba(255,255,255,0.08)",
                }}
              />

              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: config.color,
                  whiteSpace: "nowrap",
                }}
              >
                {formatMontantEUR(total)}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "14px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {items.length === 0 ? (
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.35)",
                    padding: "24px 12px",
                    margin: 0,
                  }}
                >
                  Aucun prospect
                </p>
              ) : (
                items.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    color={config.color}
                    bg={config.bg}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
