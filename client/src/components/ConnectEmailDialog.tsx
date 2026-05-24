import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  type CrmEmailConnection,
  type EmailProvider,
  providerLabel,
} from "@/lib/crmEmailStorage"
import { Loader2, Mail } from "lucide-react"

type ConnectEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection: CrmEmailConnection | null
  onConnect: (connection: CrmEmailConnection) => void
  onDisconnect: () => void
}

export function ConnectEmailDialog({
  open,
  onOpenChange,
  connection,
  onConnect,
  onDisconnect,
}: ConnectEmailDialogProps) {
  const [email, setEmail] = useState("")
  const [provider, setProvider] = useState<EmailProvider>("gmail")
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setEmail(connection?.email ?? "")
    setProvider(connection?.provider ?? "gmail")
    setError(null)
  }, [open, connection])

  const handleConnect = async () => {
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Entrez une adresse email valide.")
      return
    }

    setError(null)
    setConnecting(true)

    // Simule la validation OAuth (prêt pour une vraie intégration Gmail/Outlook)
    await new Promise((r) => setTimeout(r, 600))

    onConnect({
      email: trimmed,
      provider,
      connectedAt: new Date().toISOString(),
    })
    setConnecting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {connection ? "Compte email connecté" : "Connecter votre email"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {connection
              ? "Votre boîte est enregistrée pour les automatisations CRM (relances, suivi devis)."
              : "Liez votre adresse professionnelle pour activer les automatisations du pipeline."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="crm-email" className="text-gray-900 dark:text-white">
              Adresse email
            </Label>
            <Input
              id="crm-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
              className="bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-900 dark:text-white">Fournisseur</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as EmailProvider)}>
              <SelectTrigger className="bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="outlook">Outlook / Microsoft 365</SelectItem>
                <SelectItem value="other">Autre (IMAP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {connection && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Connecté depuis le {new Date(connection.connectedAt).toLocaleString("fr-FR")} via{" "}
              {providerLabel(connection.provider)}.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {connection && (
            <Button
              type="button"
              variant="outline"
              className="text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={() => {
                onDisconnect()
                onOpenChange(false)
              }}
            >
              Déconnecter
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-white/30"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connexion…
              </>
            ) : connection ? (
              "Mettre à jour"
            ) : (
              "Connecter"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
