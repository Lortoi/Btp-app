import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const ORANGE = "#e8702a"
const AMBER = "#f59e0b"
const GRAY = "#888888"
const RED = "#EF4444"
const WHITE = "#FFFFFF"
const GRAY_LIGHT = "#A3A3A3"
const GRAY_DARK = "#404040"

const revenueData = [
  { mois: "Déc", ca: 18200 },
  { mois: "Jan", ca: 24500 },
  { mois: "Fév", ca: 31800 },
  { mois: "Mar", ca: 38400 },
  { mois: "Avr", ca: 47200 },
  { mois: "Mai", ca: 58600 },
]

const chantierTypesData = [
  { name: "Maçonnerie", value: 35, color: ORANGE },
  { name: "Plomberie", value: 25, color: WHITE },
  { name: "Électricité", value: 20, color: GRAY_LIGHT },
  { name: "Peinture", value: 20, color: GRAY_DARK },
]

const devisData = [
  { mois: "Mar", envoyes: 6, acceptes: 4, refuses: 1 },
  { mois: "Avr", envoyes: 8, acceptes: 5, refuses: 2 },
  { mois: "Mai", envoyes: 7, acceptes: 4, refuses: 1 },
]

type TooltipPayload = { name?: string; value?: number; color?: string }

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-sm shadow-lg">
      {label ? <p className="text-white font-medium mb-1">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((entry, i) => (
          <li key={i} className="text-white/50 flex items-center gap-2">
            {entry.color ? (
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
            ) : null}
            <span>
              {entry.name}:{" "}
              <span className="text-white font-medium">
                {formatter && entry.value != null
                  ? formatter(entry.value, entry.name ?? "")
                  : entry.value?.toLocaleString("fr-FR")}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const axisTick = { fill: GRAY, fontSize: 12 }
const gridStroke = "rgba(255,255,255,0.08)"

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

const CHART_HEIGHT = 200

const chartHeaderClass = "p-3 md:p-6 lg:p-4 pb-1 md:pb-2 lg:pb-1.5"
const chartContentClass = "p-3 md:p-6 lg:p-4 pt-0"
const chartTitleClass =
  "text-xs md:text-base lg:text-sm font-bold tracking-tight text-white leading-tight"

export function DashboardCharts() {
  return (
    <div className="space-y-3 lg:space-y-4 w-full max-w-full">
      <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-2 lg:gap-4 w-full max-w-full">
        <Card className="surface-card backdrop-blur-sm min-w-0 max-w-full">
          <CardHeader className={chartHeaderClass}>
            <CardTitle className={chartTitleClass}>
              Chiffre d&apos;affaires — 6 derniers mois
            </CardTitle>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <div className="w-full overflow-hidden" style={{ height: CHART_HEIGHT }}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={revenueData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={axisTick}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    width={44}
                  />
                  <Tooltip content={<ChartTooltip formatter={(v) => formatEuro(v)} />} />
                  <Line
                    type="monotone"
                    dataKey="ca"
                    name="CA"
                    stroke={ORANGE}
                    strokeWidth={2.5}
                    dot={{ fill: ORANGE, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: ORANGE }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card backdrop-blur-sm min-w-0 max-w-full">
          <CardHeader className={chartHeaderClass}>
            <CardTitle className={chartTitleClass}>
              Types de chantiers
            </CardTitle>
          </CardHeader>
          <CardContent className={chartContentClass}>
            <div className="w-full overflow-hidden" style={{ height: CHART_HEIGHT }}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={chantierTypesData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    innerRadius="38%"
                    outerRadius="58%"
                    paddingAngle={2}
                    stroke="#0f0f0f"
                    strokeWidth={2}
                  >
                    {chantierTypesData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v) => `${v} %`} />} />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    formatter={(value) => (
                      <span className="text-white/50 text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-card backdrop-blur-sm w-full max-w-full">
        <CardHeader className={chartHeaderClass}>
          <CardTitle className="text-sm md:text-base lg:text-sm font-bold tracking-tight text-white">
            Devis — 3 derniers mois
          </CardTitle>
        </CardHeader>
        <CardContent className={chartContentClass}>
          <div className="w-full overflow-hidden" style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={devisData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  formatter={(value) => (
                    <span className="text-white/50 text-xs capitalize">{value}</span>
                  )}
                />
                <Bar dataKey="envoyes" name="Envoyés" fill={GRAY} radius={[4, 4, 0, 0]} />
                <Bar dataKey="acceptes" name="Acceptés" fill={ORANGE} radius={[4, 4, 0, 0]} />
                <Bar dataKey="refuses" name="Refusés" fill={RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
