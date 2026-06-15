import { useEffect, useState } from "react"
import { PageWrapper } from "@/components/PageWrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Moon, Shield, Upload, UserCircle, Wand2 } from "lucide-react"
import { useLocation } from "wouter"
import { type AppSettings, loadSettings, saveSettings } from "@/lib/settingsStorage"
import { useToast } from "@/hooks/use-toast"

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
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full max-w-full">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
            <p className="text-sm text-subtitle">Préférences enregistrées localement sur cet appareil</p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30 shrink-0"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-3xl overflow-x-hidden w-full">
        <Card className="surface-card backdrop-blur-sm text-foreground">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-subtitle" />
              <CardTitle className="text-lg">Compte</CardTitle>
            </div>
            <CardDescription className="text-secondary">
              Informations utilisées dans l&apos;interface. Le menu latéral « Compte » reste disponible pour le
              profil complet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom-aff" className="text-foreground">
                Nom affiché
              </Label>
              <Input
                id="nom-aff"
                value={draft.nomAffiche}
                onChange={(e) => update("nomAffiche", e.target.value)}
                placeholder="Ex. PLANCHAIS — Bureau d&apos;études"
                className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground placeholder:text-gray-400 dark:placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel-contact" className="text-foreground">
                Téléphone de contact
              </Label>
              <Input
                id="tel-contact"
                value={draft.telephoneContact}
                onChange={(e) => update("telephoneContact", e.target.value)}
                placeholder="06 12 34 56 78"
                className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground placeholder:text-gray-400 dark:placeholder:text-white/50"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="ai-surface-card backdrop-blur-sm text-foreground">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-ai-light" />
              <CardTitle className="text-lg">Import de mes données (IA)</CardTitle>
            </div>
            <CardDescription className="text-secondary">
              Importez vos factures PDF : l&apos;IA extrait clients, chantiers et montants (stockage UE Supabase).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full sm:w-auto ai-btn"
              onClick={() => setLocation("/dashboard/import")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Commencer l&apos;import
            </Button>
          </CardContent>
        </Card>

        <Card className="surface-card backdrop-blur-sm text-foreground">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-subtitle" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription className="text-secondary">
              Activez ou désactivez les rappels (stockés localement ; pas d&apos;envoi réel sans backend).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notif-chantier" className="text-foreground cursor-pointer">
                Rappels chantiers
              </Label>
              <Switch
                id="notif-chantier"
                checked={draft.notifChantiers}
                onCheckedChange={(v) => update("notifChantiers", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notif-devis" className="text-foreground cursor-pointer">
                Alertes devis
              </Label>
              <Switch
                id="notif-devis"
                checked={draft.notifDevis}
                onCheckedChange={(v) => update("notifDevis", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card backdrop-blur-sm text-foreground">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-subtitle" />
              <CardTitle className="text-lg">Apparence</CardTitle>
            </div>
            <CardDescription className="text-secondary">Confort d&apos;affichage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="reduce-motion" className="text-foreground cursor-pointer">
                Réduire les animations
              </Label>
              <Switch
                id="reduce-motion"
                checked={draft.reduireAnimations}
                onCheckedChange={(v) => update("reduireAnimations", v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card backdrop-blur-sm text-foreground">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-subtitle" />
              <CardTitle className="text-lg">Confidentialité</CardTitle>
            </div>
            <CardDescription className="text-secondary">
              Contrôlez le partage de données techniques anonymisées pour améliorer l&apos;application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="stats-anon" className="text-foreground cursor-pointer">
                Autoriser les statistiques d&apos;usage anonymes
              </Label>
              <Switch
                id="stats-anon"
                checked={draft.consentementStatsAnonymes}
                onCheckedChange={(v) => update("consentementStatsAnonymes", v)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <Button
            type="button"
            onClick={handleSave}
            className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </main>
    </PageWrapper>
  )
}
