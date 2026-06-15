import { useState, useEffect, useRef } from "react"
import { MobileMenuButton } from "@/components/MobileMenuButton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AIAssistantButton } from "@/components/AIAssistantPanel"
import { Bell, Settings, Search, Moon, Sun } from "lucide-react"
import { useLocation } from "wouter"
import { cn } from "@/lib/utils"

const THEME_STORAGE_KEY = "theme"

function applyTheme(isLight: boolean) {
  const root = document.documentElement
  root.classList.toggle("light", isLight)
  root.classList.toggle("dark", !isLight)
  root.style.colorScheme = isLight ? "light" : "dark"
  localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark")

  let styleEl = document.getElementById("app-theme-overrides") as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement("style")
    styleEl.id = "app-theme-overrides"
    document.head.appendChild(styleEl)
  }

  styleEl.textContent = isLight
    ? `
      html.light,
      html.light body {
        background-color: #f0f4ff !important;
        color: #111827 !important;
      }

      html.light div[style*="radial-gradient"],
      html.light div[style*="080d1a"] {
        background: #f0f4ff !important;
      }

      html.light .surface-header {
        background: rgba(255, 255, 255, 0.92) !important;
        border-color: #e5e7eb !important;
        color: #111827 !important;
      }

      html.light .surface-card {
        background: #ffffff !important;
        border: 1px solid #e5e7eb !important;
        color: #111827 !important;
        box-shadow: none !important;
      }

      html.light .text-title,
      html.light .text-stat {
        color: #111827 !important;
      }

      html.light .text-subtitle,
      html.light .text-secondary {
        color: #6b7280 !important;
      }

      html.light .surface-header .text-white,
      html.light .surface-header .text-white\\/30,
      html.light .surface-header .text-white\\/40 {
        color: #6b7280 !important;
      }

      html.light .surface-header .text-white\\/30:hover {
        color: #374151 !important;
      }

      html.light .surface-header svg.text-white,
      html.light .surface-header .text-white svg {
        color: #374151 !important;
      }

      html.light .surface-header button {
        border-color: #e5e7eb !important;
        background: rgba(17, 24, 39, 0.04) !important;
      }

      html.light .surface-header button:hover {
        background: rgba(17, 24, 39, 0.08) !important;
      }

      html.light .text-white:not([class*="text-[#"]):not([class*="text-red"]):not([class*="text-green"]):not([class*="text-blue"]):not([class*="text-ai"]) {
        color: #111827 !important;
      }
    `
    : ""
}

if (typeof window !== "undefined") {
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === "light")
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

function SearchModal({ open, onClose }: SearchModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div className="mx-auto mt-24 w-full max-w-lg p-4">
        <div
          className="w-full rounded-2xl border border-white/10 bg-[#0c1a30] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#e8702a]" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Rechercher chantiers, clients, devis..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-white outline-none placeholder:text-white/30 focus:border-[#e8702a]/50"
            />
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase text-white/40">Chantiers</p>
              <div className="space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                >
                  <span className="text-[#e8702a]">🏗️</span>
                  <span className="flex-1 text-sm text-white">Rénovation SDB Levallois</span>
                  <span className="rounded-full bg-[#e8702a]/15 px-2 py-0.5 text-xs text-[#e8702a]">
                    En cours
                  </span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                >
                  <span className="text-[#e8702a]">🏗️</span>
                  <span className="flex-1 text-sm text-white">Ravalement façade Neuilly</span>
                  <span className="rounded-full bg-[#e8702a]/15 px-2 py-0.5 text-xs text-[#e8702a]">
                    En cours
                  </span>
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-white/40">Clients</p>
              <div className="space-y-1">
                {[
                  { name: "Sophie Bernard", type: "Particulier", initials: "SB" },
                  { name: "Pierre Leroy", type: "Particulier", initials: "PL" },
                ].map((client) => (
                  <button
                    key={client.name}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #e8702a, #7c3aed)" }}
                    >
                      {client.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{client.name}</p>
                      <p className="text-xs text-white/40">{client.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-white/40">Devis</p>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
              >
                <span className="flex-1 text-sm text-white">DEV-202604-001</span>
                <span className="text-sm font-medium text-[#e8702a]">4 850 €</span>
                <span className="rounded-full bg-[#f59e0b]/15 px-2 py-0.5 text-xs text-[#f59e0b]">
                  En attente
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AppTopBarProps {
  showMobileMenu?: boolean
}

const iconButtonClass =
  "rounded-xl border border-white/8 bg-white/5 p-2.5 transition-all hover:bg-white/10"

export function AppTopBar({ showMobileMenu = true }: AppTopBarProps) {
  const [, setLocation] = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [isLight, setIsLight] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(THEME_STORAGE_KEY) === "light"
  })

  useEffect(() => {
    applyTheme(isLight)
  }, [isLight])

  const toggleTheme = () => {
    setIsLight((prev) => {
      const next = !prev
      applyTheme(next)
      return next
    })
  }

  return (
    <>
      <div className="surface-header relative sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-sm">
        {showMobileMenu && <MobileMenuButton />}

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Rechercher"
          className="absolute left-1/2 flex w-72 -translate-x-1/2 items-center justify-between rounded-xl border border-white/10 px-4 py-2.5 transition-all duration-200 hover:border-white/20"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-white/40" />
            <span className="text-sm text-white/30">Rechercher...</span>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/8 px-2 py-1">
            <span className="text-xs text-white/30">⌘</span>
            <span className="text-xs text-white/30">+</span>
            <span className="text-xs text-white/30">K</span>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            aria-label={isLight ? "Passer en mode sombre" : "Passer en mode clair"}
          >
            {isLight ? (
              <Sun className="h-4 w-4 text-white" />
            ) : (
              <Moon className="h-4 w-4 text-white" />
            )}
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <AIAssistantButton />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="rounded-xl border-white/10 bg-[#0f1f3d] text-white">
              Assistant IA
            </TooltipContent>
          </Tooltip>
          <button
            type="button"
            className={cn(iconButtonClass, "relative")}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-white" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <button
            type="button"
            onClick={() => setLocation("/dashboard/settings")}
            className={iconButtonClass}
            aria-label="Paramètres"
          >
            <Settings className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

export function FullPageTopBar() {
  const [location] = useLocation()
  const showAssistant = location !== "/login" && location !== "/auth" && location !== "/"

  if (!showAssistant) return null

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-end gap-2 px-4 py-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <AIAssistantButton />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="rounded-xl border-white/10 bg-[#0f1f3d] text-white">
            Assistant IA
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
