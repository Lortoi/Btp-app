import { useEffect, useState } from "react"
import { PageWrapper } from "@/components/PageWrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Moon, Shield, UserCircle } from "lucide-react"
import { type AppSettings, loadSettings, saveSettings } from "@/lib/settingsStorage"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
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
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Paramètres</h1>
            <p className="text-sm text-white/70">Préférences enregistrées localement sur cet appareil</p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30 shrink-0"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-3xl">
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-white/70" />
              <CardTitle className="text-lg">Compte</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Informations utilisées dans l&apos;interface. Le menu latéral « Compte » reste disponible pour le
              profil complet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom-aff" className="text-white">
                Nom affiché
              </Label>
              <Input
                id="nom-aff"
                value={draft.nomAffiche}
                onChange={(e) => update("nomAffiche", e.target.value)}
                placeholder="Ex. PLANCHAIS — Bureau d&apos;études"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel-contact" className="text-white">
                Téléphone de contact
              </Label>
              <Input
                id="tel-contact"
                value={draft.telephoneContact}
                onChange={(e) => update("telephoneContact", e.target.value)}
                placeholder="06 12 34 56 78"
                className="bg-black/20 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-white/70" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Activez ou désactivez les rappels (stockés localement ; pas d&apos;envoi réel sans backend).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notif-chantier" className="text-white cursor-pointer">
                Rappels chantiers
              </Label>
              <Switch
                id="notif-chantier"
                checked={draft.notifChantiers}
                onCheckedChange={(v) => update("notifChantiers", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notif-devis" className="text-white cursor-pointer">
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

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-white/70" />
              <CardTitle className="text-lg">Apparence</CardTitle>
            </div>
            <CardDescription className="text-white/60">Confort d&apos;affichage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="reduce-motion" className="text-white cursor-pointer">
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

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-white/70" />
              <CardTitle className="text-lg">Confidentialité</CardTitle>
            </div>
            <CardDescription className="text-white/60">
              Contrôlez le partage de données techniques anonymisées pour améliorer l&apos;application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="stats-anon" className="text-white cursor-pointer">
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
            className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </main>
    </PageWrapper>
  )
}
