import { MobileMenuButton } from "@/components/MobileMenuButton"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
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
      {showMobileMenu && (
        <div className="lg:hidden">
          <MobileMenuButton />
        </div>
      )}
      {title ? (
        <span className="font-semibold text-white lg:hidden">{title}</span>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <AIAssistantButton />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#111111] border-ai/30 text-white">
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
        <AnimatedThemeToggler />
      </div>
    </div>
  )
}

export function FullPageTopBar() {
  const [location] = useLocation()
  const showAssistant = location !== "/login" && location !== "/auth" && location !== "/"

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end gap-2 px-4 py-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2">
        {showAssistant && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <AIAssistantButton />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-[#111111] border-ai/30 text-white">
              Assistant IA
            </TooltipContent>
          </Tooltip>
        )}
        <div className="rounded-lg bg-white/5 backdrop-blur-sm border border-[#222222]">
          <AnimatedThemeToggler />
        </div>
      </div>
    </div>
  )
}
