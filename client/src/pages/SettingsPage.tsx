import { useEffect, useState } from "react"
import { Bell, Moon, Save, Shield, Upload, UserCircle, Wand2 } from "lucide-react"
import { useLocation } from "wouter"
import { PageWrapper } from "@/components/PageWrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useCardHover } from "@/hooks/useCardHover"
import { type AppSettings, loadSettings, saveSettings } from "@/lib/settingsStorage"

const inputStyle: React.CSSProperties = {
  background: "var(--input)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "var(--foreground)",
  width: "100%",
  fontSize: "14px",
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "6px",
  display: "block",
}

const CARD_ACCENTS = {
  compte: {
    borderLeft: "4px solid #3b82f6",
    background: "rgba(59,130,246,0.08)",
    hover: "#3b82f6",
  },
  import: {
    borderLeft: "4px solid #7c3aed",
    background: "rgba(124,58,237,0.08)",
    hover: "#7c3aed",
  },
  notifications: {
    borderLeft: "4px solid #e8702a",
    background: "rgba(232,112,42,0.08)",
    hover: "#e8702a",
  },
  apparence: {
    borderLeft: "4px solid #22c55e",
    background: "rgba(34,197,94,0.08)",
    hover: "#22c55e",
  },
  confidentialite: {
    borderLeft: "4px solid #f59e0b",
    background: "rgba(245,158,11,0.08)",
    hover: "#f59e0b",
  },
} as const

type CardAccentKey = keyof typeof CARD_ACCENTS

function SettingsCard({
  accent,
  hoverId,
  children,
}: {
  accent: CardAccentKey
  hoverId: string
  children: React.ReactNode
}) {
  const { getHoverProps, getHoverStyle } = useCardHover()
  const styles = CARD_ACCENTS[accent]

  return (
    <Card
      className="surface-card backdrop-blur-sm overflow-hidden"
      {...getHoverProps(hoverId)}
      style={{
        borderLeft: styles.borderLeft,
        background: styles.background,
        color: "var(--foreground)",
        ...getHoverStyle(hoverId, styles.hover),
      }}
    >
      {children}
    </Card>
  )
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const [draft, setDraft] = useState<AppSettings>(() => loadSettings())

  useEffect(() => {
    setDraft(loadSettings())
  }, [])

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const handleSave = () => {
    saveSettings(draft)
    toast({
      title: "Paramètres enregistrés",
      description: "Vos préférences ont été sauvegardées sur cet appareil.",
    })
  }

  return (
    <PageWrapper>
      <header className="surface-header backdrop-blur-sm px-6 py-4 rounded-tl-3xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            Paramètres
          </h1>
          <button
            type="button"
            onClick={handleSave}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "12px 28px",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <Save className="h-4 w-4" aria-hidden />
            Sauvegarder
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl overflow-x-hidden w-full">
        <div
          className="grid grid-cols-1 md:grid-cols-2 pb-8"
          style={{ gap: "20px" }}
        >
          <SettingsCard accent="compte" hoverId="settings_compte">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                <CardTitle className="text-lg" style={{ color: "var(--foreground)" }}>
                  Compte
                </CardTitle>
              </div>
              <CardDescription style={{ color: "var(--muted-foreground)" }}>
                Informations utilisées dans l&apos;interface. Le menu latéral « Compte » reste
                disponible pour le profil complet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="nom-aff" style={labelStyle}>
                  Nom affiché
                </label>
                <input
                  id="nom-aff"
                  type="text"
                  value={draft.nomAffiche}
                  onChange={(e) => update("nomAffiche", e.target.value)}
                  placeholder="Ex. Dupont Rénovation"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="tel-contact" style={labelStyle}>
                  Téléphone de contact
                </label>
                <input
                  id="tel-contact"
                  type="text"
                  value={draft.telephoneContact}
                  onChange={(e) => update("telephoneContact", e.target.value)}
                  placeholder="06 12 34 56 78"
                  style={inputStyle}
                />
              </div>
            </CardContent>
          </SettingsCard>

          <SettingsCard accent="import" hoverId="settings_import">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                <CardTitle className="text-lg" style={{ color: "var(--foreground)" }}>
                  Import de mes données (IA)
                </CardTitle>
              </div>
              <CardDescription style={{ color: "var(--muted-foreground)" }}>
                Importez vos factures PDF : l&apos;IA extrait clients, chantiers et montants
                (stockage UE Supabase).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => setLocation("/dashboard/import")}
                style={{
                  background: "rgba(124, 58, 237, 0.2)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  border: "1px solid rgba(124, 58, 237, 0.4)",
                  borderRadius: "10px",
                  color: "var(--foreground)",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 0 12px rgba(124, 58, 237, 0.12)",
                }}
              >
                <Upload className="h-4 w-4" aria-hidden />
                Commencer l&apos;import
              </button>
            </CardContent>
          </SettingsCard>

          <SettingsCard accent="notifications" hoverId="settings_notifications">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                <CardTitle className="text-lg" style={{ color: "var(--foreground)" }}>
                  Notifications
                </CardTitle>
              </div>
              <CardDescription style={{ color: "var(--muted-foreground)" }}>
                Activez ou désactivez les rappels (stockés localement ; pas d&apos;envoi réel sans
                backend).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="notif-chantier"
                  className="text-sm cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                >
                  Rappels chantiers
                </label>
                <Switch
                  id="notif-chantier"
                  checked={draft.notifChantiers}
                  onCheckedChange={(v) => update("notifChantiers", v)}
                  className="data-[state=checked]:bg-[#e8702a] data-[state=unchecked]:bg-[var(--input)]"
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="notif-devis"
                  className="text-sm cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                >
                  Alertes devis
                </label>
                <Switch
                  id="notif-devis"
                  checked={draft.notifDevis}
                  onCheckedChange={(v) => update("notifDevis", v)}
                  className="data-[state=checked]:bg-[#e8702a] data-[state=unchecked]:bg-[var(--input)]"
                />
              </div>
            </CardContent>
          </SettingsCard>

          <SettingsCard accent="apparence" hoverId="settings_apparence">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                <CardTitle className="text-lg" style={{ color: "var(--foreground)" }}>
                  Apparence
                </CardTitle>
              </div>
              <CardDescription style={{ color: "var(--muted-foreground)" }}>
                Confort d&apos;affichage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="reduce-motion"
                  className="text-sm cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                >
                  Réduire les animations
                </label>
                <Switch
                  id="reduce-motion"
                  checked={draft.reduireAnimations}
                  onCheckedChange={(v) => update("reduireAnimations", v)}
                  className="data-[state=unchecked]:bg-[var(--input)]"
                />
              </div>
            </CardContent>
          </SettingsCard>

          <SettingsCard accent="confidentialite" hoverId="settings_confidentialite">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                <CardTitle className="text-lg" style={{ color: "var(--foreground)" }}>
                  Confidentialité
                </CardTitle>
              </div>
              <CardDescription style={{ color: "var(--muted-foreground)" }}>
                Contrôlez le partage de données techniques anonymisées pour améliorer
                l&apos;application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="stats-anon"
                  className="text-sm cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                >
                  Autoriser les statistiques d&apos;usage anonymes
                </label>
                <Switch
                  id="stats-anon"
                  checked={draft.consentementStatsAnonymes}
                  onCheckedChange={(v) => update("consentementStatsAnonymes", v)}
                  className="data-[state=unchecked]:bg-[var(--input)]"
                />
              </div>
            </CardContent>
          </SettingsCard>
        </div>
      </main>
    </PageWrapper>
  )
}
