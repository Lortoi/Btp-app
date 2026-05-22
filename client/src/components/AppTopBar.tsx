import { MobileMenuButton } from "@/components/MobileMenuButton"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

interface AppTopBarProps {
  showMobileMenu?: boolean
  title?: string
}

export function AppTopBar({ showMobileMenu = true, title = "PLANCHAIS" }: AppTopBarProps) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white/85 dark:bg-black/40 backdrop-blur-xl border-b border-border dark:border-white/10">
      {showMobileMenu && (
        <div className="lg:hidden">
          <MobileMenuButton />
        </div>
      )}
      {title ? (
        <span className="font-semibold text-foreground dark:text-white lg:hidden">{title}</span>
      ) : null}
      <div className="ml-auto">
        <AnimatedThemeToggler />
      </div>
    </div>
  )
}

export function FullPageTopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end px-4 py-3 pointer-events-none">
      <div className="pointer-events-auto rounded-lg bg-white/70 dark:bg-black/30 backdrop-blur-md border border-border dark:border-white/10">
        <AnimatedThemeToggler />
      </div>
    </div>
  )
}
