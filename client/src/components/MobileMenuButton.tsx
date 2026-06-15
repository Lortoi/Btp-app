import { Menu, X } from "lucide-react"
import { useMobileNavStore } from "@/stores/mobileNavStore"
import { cn } from "@/lib/utils"

interface MobileMenuButtonProps {
  className?: string
}

/**
 * Bouton hamburger pour ouvrir/fermer la sidebar sur mobile (< lg = 1024 px).
 * - Caché automatiquement sur lg+ via `lg:hidden`.
 * - Taille tactile 44×44 px (`h-11 w-11`).
 * - Affiche `Menu` quand la sidebar est fermée, `X` quand elle est ouverte.
 * - aria-label dynamique pour l'accessibilité.
 */
export function MobileMenuButton({ className }: MobileMenuButtonProps) {
  const isOpen = useMobileNavStore((s) => s.isOpen)
  const toggle = useMobileNavStore((s) => s.toggle)

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
      aria-expanded={isOpen}
      className={cn(
        "inline-flex items-center justify-center h-9 w-9 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] text-white transition-colors shrink-0",
        className,
      )}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  )
}
