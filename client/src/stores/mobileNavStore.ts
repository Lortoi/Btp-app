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
 * Effets globaux liés au drawer de navigation :
 * - Bloque le scroll du body quand le drawer est ouvert.
 *
 * À appeler une seule fois, le plus haut possible dans l'arbre React
 * (ex. `App.tsx`). Le hook ne rend rien.
 */
export function useMobileNavSideEffects(): void {
  const isOpen = useMobileNavStore((s) => s.isOpen)

  // Body scroll lock quand le drawer est ouvert.
  useEffect(() => {
    if (typeof document === "undefined") return
    if (!isOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])
}
