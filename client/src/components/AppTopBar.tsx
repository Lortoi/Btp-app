import { MobileMenuButton } from "@/components/MobileMenuButton"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AIAssistantButton } from "@/components/AIAssistantPanel"
import { Settings } from "lucide-react"
import { useLocation } from "wouter"

interface AppTopBarProps {
  showMobileMenu?: boolean
  title?: string
}

export function AppTopBar({ showMobileMenu = true, title = "PLANCHAIS" }: AppTopBarProps) {
  const [, setLocation] = useLocation()

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 surface-header backdrop-blur-sm">
      {showMobileMenu && <MobileMenuButton />}
      {title ? (
        <span className="font-bold tracking-tight text-white" style={{ letterSpacing: "-0.03em" }}>{title}</span>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <AIAssistantButton />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1a1a1a] border-white/10 text-white rounded-xl">
            Assistant IA
          </TooltipContent>
        </Tooltip>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLocation("/dashboard/settings")}
          aria-label="Paramètres"
        >
          <Settings className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">Paramètres</span>
        </Button>
      </div>
    </div>
  )
}

export function FullPageTopBar() {
  const [location] = useLocation()
  const showAssistant = location !== "/login" && location !== "/auth" && location !== "/"

  if (!showAssistant) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end gap-2 px-4 py-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <AIAssistantButton />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1a1a1a] border-white/10 text-white rounded-xl">
            Assistant IA
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
