import { useState, useEffect, useRef, useMemo } from "react"
import { MobileMenuButton } from "@/components/MobileMenuButton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  const stale = document.getElementById("app-theme-overrides")
  if (stale) stale.remove()
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

const iconButtonClass =
  "flex shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 p-0 transition-all hover:bg-white/10"

const iconButtonStyle: React.CSSProperties = {
  width: "clamp(28px, 8vw, 36px)",
  height: "clamp(28px, 8vw, 36px)",
}

const iconGroupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "clamp(4px, 2vw, 12px)",
}

const headerBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "nowrap",
  overflow: "hidden",
}

type AppNotification = {
  id: string
  title: string
  body: string
  time: string
  emoji: string
  path: string
  read: boolean
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    title: "Devis en attente",
    body: "DEV-202604-001 — 4 850 € · Sophie Bernard",
    time: "Il y a 2 h",
    emoji: "📄",
    path: "/dashboard/quotes",
    read: false,
  },
  {
    id: "2",
    title: "Chantier en cours",
    body: "Rénovation SDB Levallois — avancement 65 %",
    time: "Il y a 5 h",
    emoji: "🏗️",
    path: "/dashboard/projects",
    read: false,
  },
  {
    id: "3",
    title: "Nouveau prospect",
    body: "Pierre Leroy — devis ravalement façade envoyé",
    time: "Hier",
    emoji: "👤",
    path: "/dashboard/crm",
    read: false,
  },
  {
    id: "4",
    title: "Rappel planning",
    body: "Réfection toiture Issy — démarrage le 5 mai",
    time: "Hier",
    emoji: "📅",
    path: "/dashboard/planning",
    read: true,
  },
]

interface NotificationsPopoverProps {
  onNavigate: (path: string) => void
}

function NotificationsPopover({ onNavigate }: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (notification: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    )
    setOpen(false)
    onNavigate(notification.path)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(iconButtonClass, "relative")}
          style={iconButtonStyle}
          aria-label="Notifications"
          aria-expanded={open}
        >
          <Bell className="h-4 w-4 text-white" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#0c1a30] p-0 text-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-white/40">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-[#e8702a] transition hover:text-[#e8702a]/80"
            >
              Tout marquer lu
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-white/40">Aucune notification</p>
          ) : (
            <ul className="py-1">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/5",
                      !notification.read && "bg-white/[0.03]",
                    )}
                  >
                    <span className="mt-0.5 text-lg leading-none">{notification.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            notification.read ? "text-white/70" : "font-medium text-white",
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#e8702a]" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-white/40">{notification.body}</p>
                      <p className="mt-1 text-[11px] text-white/30">{notification.time}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t border-white/10 px-4 py-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onNavigate("/dashboard/settings")
            }}
            className="w-full rounded-lg py-2 text-center text-xs text-white/40 transition hover:bg-white/5 hover:text-white/60"
          >
            Gérer les notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface AppTopBarProps {
  showMobileMenu?: boolean
}

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
      <div
        className="surface-header relative sticky top-0 z-30 gap-3 px-4 py-3 backdrop-blur-sm"
        style={headerBarStyle}
      >
        {showMobileMenu && <MobileMenuButton />}

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Rechercher"
          className="navbar-search absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-xl border border-white/10 px-3 py-2 transition-all duration-200 hover:border-white/20 sm:justify-between sm:px-4 sm:py-2.5"
          style={{
            background: "rgba(255,255,255,0.04)",
            width: "clamp(120px, 40vw, 400px)",
            maxWidth: "clamp(120px, 40vw, 400px)",
          }}
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-white/40" />
            <span className="hidden text-sm text-white/30 sm:inline">Rechercher...</span>
          </div>
          <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/8 px-2 py-1 md:flex">
            <span className="text-xs text-white/30">⌘</span>
            <span className="text-xs text-white/30">+</span>
            <span className="text-xs text-white/30">K</span>
          </div>
        </button>

        <div className="ml-auto min-w-0 shrink-0" style={iconGroupStyle}>
          <button
            type="button"
            onClick={toggleTheme}
            className={iconButtonClass}
            style={iconButtonStyle}
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
              <span
                className="inline-flex shrink-0 [&>button]:!h-[clamp(28px,8vw,36px)] [&>button]:!w-[clamp(28px,8vw,36px)]"
                style={iconButtonStyle}
              >
                <AIAssistantButton />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="rounded-xl border-white/10 bg-[#0f1f3d] text-white">
              Assistant IA
            </TooltipContent>
          </Tooltip>
          <NotificationsPopover onNavigate={setLocation} />
          <button
            type="button"
            onClick={() => setLocation("/dashboard/settings")}
            className={iconButtonClass}
            style={iconButtonStyle}
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
