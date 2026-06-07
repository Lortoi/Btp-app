import { useState } from "react"
import { PageWrapper } from "@/components/PageWrapper"
import { ConnectEmailDialog } from "@/components/ConnectEmailDialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail } from "lucide-react"
import { CRMPipeline } from "@/components/CRMPipeline"
import {
  clearCrmEmailConnection,
  loadCrmEmailConnection,
  providerLabel,
  saveCrmEmailConnection,
  type CrmEmailConnection,
} from "@/lib/crmEmailStorage"
import { useToast } from "@/hooks/use-toast"

export default function CRMPipelinePage() {
  const { toast } = useToast()
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [connection, setConnection] = useState<CrmEmailConnection | null>(() =>
    loadCrmEmailConnection(),
  )

  const openConnectDialog = () => setEmailDialogOpen(true)

  const handleConnect = (next: CrmEmailConnection) => {
    saveCrmEmailConnection(next)
    setConnection(next)
    toast({
      title: "Email connecté",
      description: `${next.email} (${providerLabel(next.provider)}) est prêt pour les automatisations.`,
    })
  }

  const handleDisconnect = () => {
    clearCrmEmailConnection()
    setConnection(null)
    toast({
      title: "Email déconnecté",
      description: "Les automatisations CRM sont désactivées.",
    })
  }

  return (
    <PageWrapper>
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CRM Pipeline</h1>
            <p className="text-sm text-subtitle">
              Gérez vos prospects et automatisez vos workflows
            </p>
          </div>
          <Button
            type="button"
            onClick={openConnectDialog}
            className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30 shrink-0"
          >
            {connection ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            {connection ? connection.email : "Connecter Email"}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div
          className={`flex items-center justify-between gap-3 rounded-xl max-h-12 min-h-[44px] px-4 py-2 border backdrop-blur-md ${
            connection
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700"
              : "bg-gray-50 dark:bg-white/5 border-border"
          }`}
          role="region"
          aria-label="Configuration email"
        >
          <div className="flex items-center gap-2 min-w-0">
            {connection ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Mail className="h-4 w-4 shrink-0 text-subtitle" />
            )}
            <p className="text-sm text-subtitle truncate">
              {connection
                ? `Automatisations actives — ${connection.email} (${providerLabel(connection.provider)})`
                : "Connectez votre email pour activer les automatisations"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={openConnectDialog}
            className="shrink-0 text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5 h-8 text-xs"
          >
            {connection ? "Gérer" : "Connecter"}
          </Button>
        </div>

        <CRMPipeline />
      </main>

      <ConnectEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        connection={connection}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    </PageWrapper>
  )
}
