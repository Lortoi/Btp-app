import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from '@/components/ui/button'
import Sidebar from '@/components/Sidebar'
import { AppTopBar } from '@/components/AppTopBar'
import {
  Building,
  FileText,
  Users,
  Plus,
  Calendar,
} from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { dashboardLayoutStyle } from "@/lib/dashboardLayoutStyle"
import { useChantiers, type Chantier } from "@/context/ChantiersContext"

export default function Dashboard() {
  const [location, setLocation] = useLocation();

  // Vérifier si l'utilisateur est un membre d'équipe et rediriger
  useEffect(() => {
    const userType = localStorage.getItem('userType')
    if (userType === 'team') {
      setLocation('/team-dashboard')
    }
  }, [setLocation])
  
  return (
    <div className="flex relative overflow-hidden" style={dashboardLayoutStyle}>
      {/* Sidebar - now fixed, no animation */}
      <Sidebar />

      {/* Main Content - animated */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col relative z-10 overflow-hidden w-full"
        >
        <AppTopBar />

        <header className="surface-header backdrop-blur-xl px-6 py-4 lg:rounded-tl-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-white fade-up" style={{ letterSpacing: '-0.03em' }}>
            Dashboard PLANCHAIS
          </h1>
        </header>

        {/* Tabs Navigation */}
        <div className="surface-header backdrop-blur-sm px-6 lg:rounded-tl-3xl overflow-x-hidden w-full max-w-full">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap max-w-full lg:overflow-x-visible">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }
              >
                Vue d'ensemble
              </Button>
            </Link>
            <Link href="/dashboard/quotes">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/quotes"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                Devis
              </Button>
            </Link>
            <Link href="/dashboard/projects">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/projects"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }
              >
                <Building className="h-4 w-4 mr-2" />
                Chantiers
              </Button>
            </Link>
            <Link href="/dashboard/crm">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/crm"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }
              >
                <Users className="h-4 w-4 mr-2" />
                CRM Pipeline
              </Button>
            </Link>
            <Link href="/dashboard/planning">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/planning"
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                Planning
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Content */}
        <main className="flex-1 overflow-auto overflow-x-hidden w-full max-w-full">
          <OverviewTab />
        </main>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ——— Données & helpers du dashboard ———
const ORANGE = "#e8702a"

type CaPeriod = "1 an" | "6 mois" | "3 mois" | "1 mois"

const caData = [
  { mois: "Juin", ca: 14200 },
  { mois: "Juil", ca: 15800 },
  { mois: "Août", ca: 17100 },
  { mois: "Sept", ca: 18500 },
  { mois: "Oct", ca: 19800 },
  { mois: "Nov", ca: 20900 },
  { mois: "Déc", ca: 22000 },
  { mois: "Jan", ca: 28500 },
  { mois: "Fév", ca: 31000 },
  { mois: "Mar", ca: 38500 },
  { mois: "Avr", ca: 43600 },
  { mois: "Mai", ca: 51600 },
]

const CA_PERIODS: CaPeriod[] = ["1 an", "6 mois", "3 mois", "1 mois"]

const PERIOD_POINTS: Record<CaPeriod, number> = {
  "1 an": 12,
  "6 mois": 6,
  "3 mois": 3,
  "1 mois": 1,
}

function sumCa(data: typeof caData) {
  return data.reduce((sum, d) => sum + d.ca, 0)
}

function toCumulative(data: typeof caData) {
  let running = 0
  return data.map((d) => {
    running += d.ca
    return { mois: d.mois, ca: running }
  })
}

function formatGrowth(current: number, previous: number) {
  if (previous <= 0) return "+0,0%"
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1).replace(".", ",")}%`
}

function getCaPeriodView(period: CaPeriod) {
  const count = PERIOD_POINTS[period]
  const monthlyData = caData.slice(-count)

  if (period === "1 mois") {
    const current = monthlyData[0]?.ca ?? 0
    const previous = caData[caData.length - 2]?.ca ?? 0
    return {
      displayedCaData: monthlyData,
      headlineValue: current,
      subtitle: `${formatGrowth(current, previous)} vs mois dernier`,
    }
  }

  const headlineValue = sumCa(monthlyData)
  const displayedCaData = toCumulative(monthlyData)
  const previousMonthly = caData.slice(-count * 2, -count)

  if (previousMonthly.length === count) {
    const previousTotal = sumCa(previousMonthly)
    return {
      displayedCaData,
      headlineValue,
      subtitle: `${formatGrowth(headlineValue, previousTotal)} vs période précédente`,
    }
  }

  const half = count / 2
  const firstHalf = sumCa(monthlyData.slice(0, half))
  const secondHalf = sumCa(monthlyData.slice(half))
  return {
    displayedCaData,
    headlineValue,
    subtitle: `${formatGrowth(secondHalf, firstHalf)} vs 1re moitié`,
  }
}

const devisData = [
  { mois: "Mar", envoyes: 6, acceptes: 4, refuses: 1 },
  { mois: "Avr", envoyes: 8, acceptes: 5, refuses: 2 },
  { mois: "Mai", envoyes: 7, acceptes: 4, refuses: 1 },
]

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

function chantierStatutBadge(statut: Chantier["statut"]): string {
  switch (statut) {
    case "en cours":
      return "bg-[#e8702a]/15 text-[#e8702a]"
    case "planifié":
      return "bg-[#7c3aed]/15 text-[#7c3aed]"
    case "terminé":
      return "bg-[#22c55e]/15 text-[#22c55e]"
    default:
      return "bg-white/10 text-white/50"
  }
}

const KPI_ACCENTS = [
  {
    border: "#e8702a",
    from: "rgba(232,112,42,0.10)",
  },
  {
    border: "#f59e0b",
    from: "rgba(245,158,11,0.10)",
  },
  {
    border: "#22c55e",
    from: "rgba(34,197,94,0.10)",
  },
  {
    border: "#7c3aed",
    from: "rgba(124,58,237,0.10)",
  },
  {
    border: "#06b6d4",
    from: "rgba(6,182,212,0.10)",
  },
]

function chantierMontant(chantier: Chantier): number {
  const weeks = parseInt(chantier.duree, 10) || 1
  return weeks * 6200
}

type TooltipPayload = { value?: number; name?: string }

function MiniTooltip({
  active,
  payload,
  label,
  euro,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  euro?: boolean
}) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value ?? 0
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm shadow-lg">
      {label ? <p className="text-white/50 text-xs mb-0.5">{label}</p> : null}
      <p className="text-white font-semibold">
        {euro ? formatEuro(v) : v.toLocaleString("fr-FR")}
      </p>
    </div>
  )
}

const axisTick = { fill: "#888888", fontSize: 12 }
const gridStroke = "rgba(255,255,255,0.08)"
const cardBase =
  "bg-[#0d0d0d] border border-white/[0.06] rounded-2xl hover:border-white/15 transition-all duration-200"

// Overview Tab Component
function OverviewTab() {
  const [, setLocation] = useLocation()
  const { chantiers } = useChantiers()
  const [period, setPeriod] = useState<CaPeriod>("6 mois")

  const { displayedCaData, headlineValue, subtitle } = getCaPeriodView(period)

  const recentChantiers = useMemo(
    () =>
      [...chantiers]
        .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))
        .slice(0, 3),
    [chantiers],
  )

  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: formatEuro(headlineValue),
      sub: subtitle,
      path: "/dashboard",
    },
    {
      label: "Chantiers actifs",
      value: "4",
      sub: "2 en cours",
      path: "/dashboard/projects",
    },
    {
      label: "Devis en attente",
      value: "3",
      sub: "Réponses attendues",
      path: "/dashboard/quotes",
    },
    {
      label: "Taux de conversion",
      value: "67%",
      sub: "devis → chantiers",
      path: "/dashboard/crm",
    },
    {
      label: "Clients",
      value: "4",
      sub: "au total",
      path: "/dashboard/clients",
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4 w-full max-w-full">
      {/* Colonne gauche : CA + Devis */}
      <div className="space-y-4 min-w-0">
        {/* Graphique CA principal */}
        <div
          className={`fade-up ${cardBase} p-5 md:p-6 min-h-[320px]`}
          style={{
            animationDelay: "0.1s",
            boxShadow: "0 20px 60px rgba(232,112,42,0.10)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest">
                Chiffre d&apos;affaires
              </p>
              <p className="text-4xl md:text-5xl font-bold text-white mt-2" style={{ letterSpacing: "-0.03em" }}>
                {formatEuro(headlineValue)}
              </p>
              <p className="text-sm text-green-400 mt-1">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CA_PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    period === p
                      ? "bg-[#e8702a]/15 text-[#e8702a]"
                      : "bg-white/5 hover:bg-white/10 text-white/50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 -mx-1" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayedCaData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  width={44}
                />
                <Tooltip content={<MiniTooltip euro />} />
                <Area
                  type="monotone"
                  dataKey="ca"
                  stroke={ORANGE}
                  strokeWidth={2}
                  fill="url(#caGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique Devis */}
        <div className={`fade-up ${cardBase} p-5 md:p-6`} style={{ animationDelay: "0.2s" }}>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
            Devis — 3 derniers mois
          </p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={devisData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={32} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="envoyes" fill="#4b5563" name="Envoyés" />
                <Bar dataKey="acceptes" fill="#e8702a" name="Acceptés" />
                <Bar dataKey="refuses" fill="#ef4444" name="Refusés" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Légende manuelle */}
          <div className="flex gap-4 mt-3 justify-center">
            {[
              { label: "Envoyés",  color: "#4b5563" },
              { label: "Acceptés", color: "#e8702a" },
              { label: "Refusés",  color: "#ef4444" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                <span className="text-white/40 text-xs">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne droite : 4 KPI + chantiers récents */}
      <div className="space-y-4 min-w-0">
        <div className="grid grid-cols-1 gap-3">
          {kpis.map((kpi, i) => {
            const accent = KPI_ACCENTS[i]
            return (
              <div
                key={kpi.label}
                role="button"
                tabIndex={0}
                onClick={() => setLocation(kpi.path)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setLocation(kpi.path)
                  }
                }}
                style={{
                  animationDelay: `${0.15 + i * 0.1}s`,
                  borderLeft: `4px solid ${accent.border}`,
                  background: `linear-gradient(135deg, ${accent.from} 0%, transparent 70%)`,
                }}
                className="fade-up bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-4 cursor-pointer hover:border-white/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <p className="text-white/40 text-xs uppercase tracking-widest">{kpi.label}</p>
                <p className="text-3xl font-bold text-white mt-1" style={{ letterSpacing: "-0.02em" }}>
                  {kpi.value}
                </p>
                <p className="text-white/40 text-xs mt-1">{kpi.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Chantiers récents */}
        <div className={`fade-up ${cardBase} p-5`} style={{ animationDelay: "0.55s" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/50 text-xs uppercase tracking-widest">
              Chantiers récents
            </p>
            <button
              type="button"
              onClick={() => setLocation("/dashboard/projects")}
              className="text-white/40 hover:text-white/80 text-xs transition-colors"
            >
              Tout voir
            </button>
          </div>
          <div>
            {recentChantiers.map((chantier) => (
              <button
                key={chantier.id}
                type="button"
                onClick={() => setLocation("/dashboard/projects")}
                className="w-full flex justify-between items-center gap-2 py-3 border-b border-white/5 last:border-b-0 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{chantier.nom}</p>
                  <span
                    className={`inline-block mt-1 rounded-full text-xs px-2 py-0.5 ${chantierStatutBadge(chantier.statut)}`}
                  >
                    {chantier.statut}
                  </span>
                </div>
                <span className="text-[#e8702a] text-sm font-semibold shrink-0">
                  {formatEuro(chantierMontant(chantier))}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className={`fade-up ${cardBase} p-5 space-y-2`} style={{ animationDelay: "0.5s" }}>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Actions rapides</p>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => setLocation("/dashboard/projects?openDialog=true")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Chantier
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => setLocation("/dashboard/quotes")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Créer un Devis
          </Button>
        </div>
      </div>
    </div>
  )
}

// Les vues Devis/Chantiers/CRM/Planning (etc.) sont des pages dédiées
// accessibles via la sidebar (et via les boutons de navigation ci-dessus).
