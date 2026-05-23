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
        "lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-white/20 active:bg-white/25 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white transition-colors shrink-0",
        className,
      )}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  )
}
