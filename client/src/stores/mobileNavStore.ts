import { useEffect } from "react"
import { create } from "zustand"

/**
 * État partagé du drawer de navigation mobile.
 *
 * Le drawer (Sidebar / TeamSidebar) est un overlay sur < lg (1024 px).
 * Au-dessus de lg, la sidebar reste fixée à gauche et cet état n'a aucun
 * effet visuel — le `isOpen` est simplement ignoré par les classes Tailwind
 * `lg:translate-x-0` / `lg:hidden`.
 */
interface MobileNavState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}))

/**
 * Effets globaux liés au drawer mobile :
 * - Bloque le scroll du body quand le drawer est ouvert.
 * - Ferme automatiquement le drawer si on passe en lg+ (> 1024 px).
 *
 * À appeler une seule fois, le plus haut possible dans l'arbre React
 * (ex. `App.tsx`). Le hook ne rend rien.
 */
const LG_BREAKPOINT_PX = 1024

export function useMobileNavSideEffects(): void {
  const isOpen = useMobileNavStore((s) => s.isOpen)
  const close = useMobileNavStore((s) => s.close)

  // Body scroll lock (mobile uniquement). Aucun effet sur desktop car
  // le drawer y est fermé en permanence (isOpen reste false).
  useEffect(() => {
    if (typeof document === "undefined") return
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  // Fermeture automatique du drawer si on passe en lg+ via resize.
  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT_PX}px)`)
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) close()
    }
    // Init (cas où on monte déjà en desktop)
    onChange(mql)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [close])
}
