import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Building, Clock, User } from 'lucide-react';
import { useChantiers } from '@/context/ChantiersContext';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCardHover } from '@/hooks/useCardHover';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createChantier,
  fetchChantiers,
  fetchClients,
  type ChantierRowWithClient,
  type ChantierStatutDb,
  type ClientRow,
} from "@/lib/supabase"

/** Chantiers fictifs BTP — avril / mai / juin 2026 (données mock, hors composant) */
interface MockPlanningChantier {
  id: string
  nom: string
  dateDebut: string
  dateFin: string
  couleur: string
  client: string
  statut: string
}

const mockChantiers: MockPlanningChantier[] = [
  {
    id: "mock-1",
    nom: "Rénovation salle de bain Levallois",
    dateDebut: "2026-04-01",
    dateFin: "2026-04-12",
    couleur: "#F5A623",
    client: "Sophie Bernard",
    statut: "En cours",
  },
  {
    id: "mock-2",
    nom: "Ravalement façade Neuilly",
    dateDebut: "2026-04-08",
    dateFin: "2026-04-28",
    couleur: "#3B82F6",
    client: "Pierre Leroy",
    statut: "En cours",
  },
  {
    id: "mock-3",
    nom: "Extension maison Boulogne",
    dateDebut: "2026-01-15",
    dateFin: "2026-03-20",
    couleur: "#10B981",
    client: "Marie Martin",
    statut: "Terminé",
  },
  {
    id: "mock-4",
    nom: "Réfection toiture Issy-les-Moulineaux",
    dateDebut: "2026-05-05",
    dateFin: "2026-05-22",
    couleur: "#8B5CF6",
    client: "SCI Les Pins",
    statut: "Planifié",
  },
  {
    id: "mock-5",
    nom: "Carrelage cuisine Vincennes",
    dateDebut: "2026-05-18",
    dateFin: "2026-05-25",
    couleur: "#EF4444",
    client: "Caroline Roche",
    statut: "Planifié",
  },
  {
    id: "mock-6",
    nom: "Couverture Zinguerie Les Oliviers",
    dateDebut: "2026-05-02",
    dateFin: "2026-05-10",
    couleur: "#F5A623",
    client: "Copropriété Les Oliviers",
    statut: "En cours",
  },
  {
    id: "mock-7",
    nom: "Gros œuvre Local commercial Rivoli",
    dateDebut: "2026-05-05",
    dateFin: "2026-05-19",
    couleur: "#3B82F6",
    client: "SARL Rivoli Commerce",
    statut: "Planifié",
  },
  {
    id: "mock-8",
    nom: "Isolation ITE Bâtiment C",
    dateDebut: "2026-05-08",
    dateFin: "2026-05-16",
    couleur: "#10B981",
    client: "Habitat Méditerranée",
    statut: "En cours",
  },
  {
    id: "mock-9",
    nom: "VMC et désenfumage Gymnase",
    dateDebut: "2026-05-14",
    dateFin: "2026-05-21",
    couleur: "#8B5CF6",
    client: "Mairie — secteur sport",
    statut: "Planifié",
  },
  {
    id: "mock-10",
    nom: "Terrassement parking souterrain",
    dateDebut: "2026-05-18",
    dateFin: "2026-05-27",
    couleur: "#EAB308",
    client: "Promoteur Atlas",
    statut: "En cours",
  },
  {
    id: "mock-11",
    nom: "Finitions peinture Hall A",
    dateDebut: "2026-05-22",
    dateFin: "2026-05-28",
    couleur: "#EC4899",
    client: "Résidence Horizon",
    statut: "Planifié",
  },
  {
    id: "mock-12",
    nom: "Rénovation SDB Bernard",
    dateDebut: "2026-06-02",
    dateFin: "2026-06-09",
    couleur: "#F5A623",
    client: "M. et Mme Bernard",
    statut: "En cours",
  },
  {
    id: "mock-13",
    nom: "Carrelage cuisine Moreau",
    dateDebut: "2026-06-05",
    dateFin: "2026-06-12",
    couleur: "#3B82F6",
    client: "Famille Moreau",
    statut: "Planifié",
  },
  {
    id: "mock-14",
    nom: "Peinture appartement T3",
    dateDebut: "2026-06-10",
    dateFin: "2026-06-17",
    couleur: "#10B981",
    client: "SCI Les Terrasses",
    statut: "En cours",
  },
  {
    id: "mock-15",
    nom: "Ravalement immeuble Haussmann",
    dateDebut: "2026-06-12",
    dateFin: "2026-06-27",
    couleur: "#EF4444",
    client: "Syndic Haussmann 8",
    statut: "Planifié",
  },
  {
    id: "mock-16",
    nom: "Pose fenêtres PVC",
    dateDebut: "2026-06-16",
    dateFin: "2026-06-20",
    couleur: "#8B5CF6",
    client: "Mme Petit",
    statut: "En cours",
  },
  {
    id: "mock-17",
    nom: "Réfection toiture garage",
    dateDebut: "2026-06-18",
    dateFin: "2026-06-24",
    couleur: "#EAB308",
    client: "Garage Central Auto",
    statut: "Planifié",
  },
  {
    id: "mock-18",
    nom: "Aménagement combles 45 m²",
    dateDebut: "2026-06-22",
    dateFin: "2026-06-30",
    couleur: "#EC4899",
    client: "M. Girard",
    statut: "En cours",
  },
  {
    id: "mock-19",
    nom: "Dépannage fuite cuisine",
    dateDebut: "2026-06-03",
    dateFin: "2026-06-03",
    couleur: "#06B6D4",
    client: "Résidence Bellevue",
    statut: "Terminé",
  },
  {
    id: "mock-20",
    nom: "Terrasse bois composite",
    dateDebut: "2026-06-25",
    dateFin: "2026-06-30",
    couleur: "#84CC16",
    client: "M. et Mme Roche",
    statut: "Planifié",
  },
]

const MONTH_ABBR_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const

function dateToYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function isYmdInRange(dayYmd: string, debut: string, fin: string): boolean {
  return dayYmd >= debut && dayYmd <= fin
}


function mockChantierOverlapsMonth(c: MockPlanningChantier, month: number, year: number): boolean {
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return c.dateDebut <= monthEnd && c.dateFin >= monthStart
}

const PLANNING_STATUTS = ["Planifié", "En cours", "Terminé"] as const
type PlanningStatutLabel = (typeof PLANNING_STATUTS)[number]

function statutDbToLabel(statut: string): PlanningStatutLabel {
  if (statut === "en_cours") return "En cours"
  if (statut === "termine") return "Terminé"
  return "Planifié"
}

function statutLabelToDb(statut: PlanningStatutLabel): ChantierStatutDb {
  if (statut === "En cours") return "en_cours"
  if (statut === "Terminé") return "termine"
  return "planifie"
}

function chantierRowToPlanning(c: ChantierRowWithClient): MockPlanningChantier {
  return {
    id: c.id,
    nom: c.nom,
    dateDebut: c.date_debut?.slice(0, 10) ?? "",
    dateFin: c.date_fin?.slice(0, 10) ?? "",
    couleur: c.couleur ?? "#f59e0b",
    client: c.clients?.nom ?? "—",
    statut: statutDbToLabel(c.statut),
  }
}

const defaultChantierForm = {
  nom: "",
  clientId: "",
  dateDebut: "",
  dateFin: "",
  couleur: "#f59e0b",
  statut: "Planifié" as PlanningStatutLabel,
}

function formatLegendPeriod(debut: string, fin: string): string {
  const [y1, m1, d1] = debut.split("-").map(Number)
  const [y2, m2, d2] = fin.split("-").map(Number)
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return `${debut} → ${fin}`
  const sameMonth = m1 === m2 && y1 === y2
  if (sameMonth) {
    return `${d1}–${d2} ${MONTH_ABBR_FR[m1 - 1]}`
  }
  return `${d1} ${MONTH_ABBR_FR[m1 - 1]} – ${d2} ${MONTH_ABBR_FR[m2 - 1]}`
}

function formatRangeFr(debut: string, fin: string): string {
  const [y1, m1, d1] = debut.split("-").map(Number)
  const [y2, m2, d2] = fin.split("-").map(Number)
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return `${debut} → ${fin}`
  const a = new Date(y1, m1 - 1, d1)
  const b = new Date(y2, m2 - 1, d2)
  return `${a.toLocaleDateString("fr-FR")} → ${b.toLocaleDateString("fr-FR")}`
}

// Fonction pour parser la durée et calculer la date de fin
function calculateEndDate(dateDebut: string, duree: string): Date {
  const startDate = new Date(dateDebut);
  const dureeLower = duree.toLowerCase().trim();
  
  // Parser différentes formats de durée
  let daysToAdd = 0;
  
  if (dureeLower.includes('semaine') || dureeLower.includes('sem')) {
    const weeks = parseInt(dureeLower.match(/\d+/)?.[0] || '1');
    daysToAdd = weeks * 7;
  } else if (dureeLower.includes('mois')) {
    const months = parseInt(dureeLower.match(/\d+/)?.[0] || '1');
    daysToAdd = months * 30; // Approximation
  } else if (dureeLower.includes('jour') || dureeLower.includes('j')) {
    const days = parseInt(dureeLower.match(/\d+/)?.[0] || '1');
    daysToAdd = days;
  } else {
    // Si c'est juste un nombre, on assume des jours
    const days = parseInt(dureeLower.match(/\d+/)?.[0] || '1');
    daysToAdd = days;
  }
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysToAdd);
  return endDate;
}

// Fonction pour obtenir les jours du mois
function getDaysInMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days = [];
  
  // Ajouter les jours du mois précédent pour compléter la première semaine
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  // Ajouter les jours du mois actuel
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.toDateString() === today.toDateString()
    });
  }
  
  // Ajouter les jours du mois suivant pour compléter la dernière semaine
  const remainingDays = 42 - days.length; // 6 semaines * 7 jours
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  return days;
}

export default function PlanningPage() {
  const { chantiers } = useChantiers();
  const { getHoverProps, getHoverStyle } = useCardHover();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNewEventOpen, setIsNewEventOpen] = useState(false)
  const [isChantierModalOpen, setIsChantierModalOpen] = useState(false)
  const [dbChantiers, setDbChantiers] = useState<MockPlanningChantier[]>([])
  const [dbClients, setDbClients] = useState<ClientRow[]>([])
  const [chantierForm, setChantierForm] = useState(defaultChantierForm)
  const [chantierSubmitting, setChantierSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [datePickerKey, setDatePickerKey] = useState(0)
  const [newEventTime, setNewEventTime] = useState("11:30")
  const [newEventTitle, setNewEventTitle] = useState("Rendez-vous")
  const [customEvents, setCustomEvents] = useState<Array<{ id: string; dateKey: string; time: string; title: string }>>([])
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const allPlanningChantiers = useMemo(
    () => [...mockChantiers, ...dbChantiers],
    [dbChantiers],
  );

  const loadPlanningChantiers = useCallback(async () => {
    const rows = await fetchChantiers()
    setDbChantiers(rows.map(chantierRowToPlanning))
  }, [])

  const loadDbClients = useCallback(async () => {
    setDbClients(await fetchClients())
  }, [])

  useEffect(() => {
    void loadPlanningChantiers()
  }, [loadPlanningChantiers])

  useEffect(() => {
    if (isChantierModalOpen) void loadDbClients()
  }, [isChantierModalOpen, loadDbClients])

  const getChantiersForDay = useCallback(
    (dayYmd: string) =>
      allPlanningChantiers.filter((c) => isYmdInRange(dayYmd, c.dateDebut, c.dateFin)),
    [allPlanningChantiers],
  )

  const mockForMonth = useMemo(
    () => allPlanningChantiers.filter((c) => mockChantierOverlapsMonth(c, month, year)),
    [allPlanningChantiers, month, year],
  );

  const handleChantierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chantierForm.nom.trim() || !chantierForm.clientId || !chantierForm.dateDebut || !chantierForm.dateFin) {
      return
    }

    setChantierSubmitting(true)
    try {
      const created = await createChantier({
        nom: chantierForm.nom.trim(),
        client_id: chantierForm.clientId,
        date_debut: chantierForm.dateDebut,
        date_fin: chantierForm.dateFin,
        couleur: chantierForm.couleur,
        statut: statutLabelToDb(chantierForm.statut),
      })

      if (created) {
        setIsChantierModalOpen(false)
        setChantierForm(defaultChantierForm)
        await loadPlanningChantiers()
      }
    } finally {
      setChantierSubmitting(false)
    }
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleTodayClick = () => {
    const today = new Date()
    setCurrentDate(today)
    openNewEvent(today)
  }

  const setMonthYear = (nextMonth: number, nextYear: number) => {
    setCurrentDate(new Date(nextYear, nextMonth, 1))
  }

  const toDateInputValue = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const fromDateInputValue = (value: string) => {
    const [y, m, d] = value.split("-").map((x) => Number(x))
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  }

  const shiftSelectedDateByDays = (delta: number) => {
    if (!selectedDate) return
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + delta)
    setSelectedDate(next)
    setCurrentDate(next)
    setDatePickerKey((k) => k + 1)
  }

  const shiftTimeHours = (delta: number) => {
    const [hhRaw, mmRaw] = (newEventTime || "00:00").split(":")
    const hh = Number(hhRaw)
    const mm = Number(mmRaw)
    const safeH = Number.isFinite(hh) ? hh : 0
    const safeM = Number.isFinite(mm) ? mm : 0
    const nextH = (safeH + delta + 24) % 24
    const next = `${String(nextH).padStart(2, "0")}:${String(safeM).padStart(2, "0")}`
    setNewEventTime(next)
  }

  const openNewEvent = (d: Date) => {
    setSelectedDate(d)
    setEditingEventId(null)
    setIsNewEventOpen(true)
  }

  const addCustomEvent = () => {
    if (!selectedDate) return
    if (!newEventTime.trim() || !newEventTitle.trim()) return

    setCustomEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        dateKey: dateToYmd(selectedDate),
        time: newEventTime.trim(),
        title: newEventTitle.trim(),
      },
    ])
    setIsNewEventOpen(false)
  }

  const openEditEvent = (event: { id: string; dateKey: string; time: string; title: string }) => {
    const [y, m, d] = event.dateKey.split("-").map((x) => Number(x))
    const dt = new Date(y, (m || 1) - 1, d || 1)
    setSelectedDate(dt)
    setCurrentDate(dt)
    setNewEventTime(event.time)
    setNewEventTitle(event.title)
    setEditingEventId(event.id)
    setIsNewEventOpen(true)
  }

  const saveEditedEvent = () => {
    if (!editingEventId) return
    if (!selectedDate) return
    if (!newEventTime.trim() || !newEventTitle.trim()) return

    setCustomEvents((prev) =>
      prev.map((ev) =>
        ev.id === editingEventId
          ? {
              ...ev,
              dateKey: dateToYmd(selectedDate),
              time: newEventTime.trim(),
              title: newEventTitle.trim(),
            }
          : ev,
      ),
    )
    setIsNewEventOpen(false)
  }

  const deleteEditedEvent = () => {
    if (!editingEventId) return
    setCustomEvents((prev) => prev.filter((ev) => ev.id !== editingEventId))
    setIsNewEventOpen(false)
  }
  
  return (
    <PageWrapper>
      <header
        className="surface-header backdrop-blur-sm px-6 py-4"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-white" style={{ letterSpacing: '-0.03em' }}>
          Planning des Chantiers
        </h1>
        <button
          type="button"
          onClick={() => setIsChantierModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))",
            border: "1px solid rgba(124,58,237,0.4)",
            borderRadius: "10px",
            padding: "8px 16px",
            color: "#a78bfa",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.8)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"
          }}
        >
          <span style={{ fontSize: "18px", lineHeight: 1 }}>+</span>
          Ajouter un chantier
        </button>
      </header>

      <main className="flex-1 p-4 space-y-4 overflow-x-hidden w-full max-w-full">

        {/* ── Contrôles ────────────────────────────────────────── */}
        <div
          className="bg-[#0a1628] border border-white/[0.06] rounded-2xl px-4 py-3"
          {...getHoverProps('planning_toolbar')}
          style={getHoverStyle('planning_toolbar', '#3b82f6')}
        >
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                ‹
              </button>
              <select
                value={month}
                onChange={(e) => setMonthYear(Number(e.target.value), year)}
                className="bg-[#0c1a30] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none hover:border-white/20 transition-colors appearance-none cursor-pointer"
                aria-label="Mois"
              >
                {monthNames.map((mName, idx) => (
                  <option key={mName} value={idx} className="bg-[#0c1a30]">{mName}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setMonthYear(month, Number(e.target.value))}
                className="bg-[#0c1a30] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none hover:border-white/20 transition-colors appearance-none cursor-pointer"
                aria-label="Année"
              >
                {Array.from({ length: 11 }, (_, i) => year - 5 + i).map((y) => (
                  <option key={y} value={y} className="bg-[#0c1a30]">{y}</option>
                ))}
              </select>
              <button
                onClick={goToNextMonth}
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
              >
                ›
              </button>
            </div>
            <button
              onClick={handleTodayClick}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
        </div>

        {/* ── CALENDRIER UNIQUE (mobile + desktop) ──────────────── */}
        <div
          className="w-full bg-[#0a1628] border border-white/[0.06] rounded-2xl overflow-hidden"
          {...getHoverProps('planning_calendar')}
          style={getHoverStyle('planning_calendar', '#3b82f6')}
        >
          <div className="p-2 md:p-5">

            {/* En-têtes jours */}
            <div className="grid grid-cols-7 mb-1 md:mb-3">
              {dayNames.map((day) => (
                <div key={day} className="text-center font-medium text-white/30 uppercase tracking-wider py-1 md:py-2"
                  style={{ fontSize: 10 }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Grille */}
            <div className="grid grid-cols-7 gap-px md:gap-1">
              {days.map((day, index) => {
                const dayYmd = dateToYmd(day.date)
                const mockForDay = getChantiersForDay(dayYmd)
                const isToday = day.isToday
                const dayCustomEvents = customEvents.filter((e) => e.dateKey === dayYmd)

                return (
                  <div
                    key={index}
                    {...getHoverProps(`planning_day_${index}`)}
                    style={getHoverStyle(`planning_day_${index}`, '#3b82f6')}
                    className={`min-h-[80px] p-1 md:p-1.5 rounded-lg md:rounded-xl border cursor-pointer transition-colors ${
                      day.isCurrentMonth
                        ? isToday
                          ? 'bg-white/[0.06] border-white/30 ring-1 ring-white/20'
                          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10'
                        : 'border-transparent opacity-25'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNewEvent(day.date)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openNewEvent(day.date)
                    }}
                  >
                    {/* Numéro du jour */}
                    <div className={`text-xs font-semibold mb-0.5 md:mb-1 flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full ${
                      isToday ? 'bg-white text-black' : 'text-white/60'
                    }`}>
                      {day.date.getDate()}
                    </div>

                    {/* Custom events (desktop uniquement pour ne pas surcharger mobile) */}
                    <div className="hidden md:block">
                      {dayCustomEvents.slice(0, 1).map((event) => (
                        <div
                          key={event.id}
                          role="button"
                          tabIndex={0}
                          className="text-xs bg-white/10 border border-white/10 text-white rounded-md px-1 py-0.5 truncate mb-0.5 cursor-pointer hover:bg-white/15 transition-colors"
                          title={`${event.time} - ${event.title}`}
                          onClick={(e) => { e.stopPropagation(); openEditEvent(event) }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); openEditEvent(event) }
                          }}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                    </div>

                    {/* Barres chantiers */}
                    <div className="flex flex-col">
                      {mockForDay.map((chantier) => (
                        <div
                          key={chantier.id}
                          title={chantier.nom}
                          style={{
                            backgroundColor: chantier.couleur,
                            height: '20px',
                            minHeight: '20px',
                            lineHeight: '20px',
                            fontSize: '10px',
                            fontWeight: '500',
                            color: 'white',
                            padding: '0 4px',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            width: '100%',
                            display: 'block',
                            marginBottom: '2px',
                          }}
                        >
                          {chantier.nom}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Légende */}
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Légende</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {mockForMonth.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span className="shrink-0 w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.couleur }} />
                    <span className="font-medium text-white/60 text-xs">{c.nom}</span>
                    <span className="text-white/25 text-xs hidden md:inline">{formatLegendPeriod(c.dateDebut, c.dateFin)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── LISTE CHANTIERS DU MOIS (toutes tailles) ──────────── */}
        <div className="space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-widest px-1">
            {monthNames[month]} {year} — {mockForMonth.length} chantier{mockForMonth.length !== 1 ? 's' : ''}
          </p>
          {mockForMonth.length === 0 ? (
            <p className="text-white/30 text-sm px-1">Aucun chantier sur ce mois.</p>
          ) : (
            mockForMonth.map((chantier) => {
              const statutStyle =
                chantier.statut === 'En cours'
                  ? 'bg-[#e8702a]/15 text-[#e8702a]'
                  : chantier.statut === 'Planifié'
                  ? 'bg-[#7c3aed]/15 text-[#7c3aed]'
                  : 'bg-[#22c55e]/15 text-[#22c55e]'
              return (
                <div
                  key={chantier.id}
                  className="bg-[#0c1a30] rounded-xl border border-white/[0.06] p-4"
                  style={{ borderLeft: `4px solid ${chantier.couleur}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{chantier.nom}</p>
                      <p className="text-white/40 text-xs mt-0.5">{chantier.client}</p>
                      <p className="text-white/30 text-xs mt-1">{formatRangeFr(chantier.dateDebut, chantier.dateFin)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full text-xs px-2 py-0.5 ${statutStyle}`}>
                      {chantier.statut}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
          <DialogContent className="bg-[#080d1a]/30 backdrop-blur-xl border border-border text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Nouveau rendez-vous</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="planning-event-date" className="text-foreground">Date</Label>
                <div className="flex items-center gap-2">
                  <Input
                    key={datePickerKey}
                    id="planning-event-date"
                    type="date"
                    value={selectedDate ? toDateInputValue(selectedDate) : ""}
                    onDoubleClick={(e) => {
                      const el = e.currentTarget as any
                      if (typeof el?.showPicker === "function") el.showPicker()
                    }}
                    onChange={(e) => {
                      const next = fromDateInputValue(e.target.value)
                      if (!next) return
                      setSelectedDate(next)
                      setCurrentDate(next)
                    }}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shiftSelectedDateByDays(-1)}
                    className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5 px-3"
                    disabled={!selectedDate}
                    title="Jour précédent"
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shiftSelectedDateByDays(1)}
                    className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5 px-3"
                    disabled={!selectedDate}
                    title="Jour suivant"
                  >
                    →
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning-event-time" className="text-foreground">Heure</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="planning-event-time"
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                  />
                  <div className="grid grid-rows-2 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => shiftTimeHours(1)}
                      className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5 px-3 h-9 w-9"
                      title="Heure +1"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => shiftTimeHours(-1)}
                      className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5 px-3 h-9 w-9"
                      title="Heure -1"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning-event-title" className="text-foreground">Titre</Label>
                <Input
                  id="planning-event-title"
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewEventOpen(false)}
                className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5"
              >
                Annuler
              </Button>
              {editingEventId ? (
                <>
                  <Button variant="outline" onClick={deleteEditedEvent} className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5">
                    Supprimer
                  </Button>
                  <Button onClick={saveEditedEvent}>Enregistrer</Button>
                </>
              ) : (
                <Button onClick={addCustomEvent}>Ajouter</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isChantierModalOpen} onOpenChange={setIsChantierModalOpen}>
          <DialogContent className="surface-card backdrop-blur-sm text-foreground rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Ajouter un chantier</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleChantierSubmit} className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="chantier-nom" className="text-foreground">Nom chantier</Label>
                <Input
                  id="chantier-nom"
                  required
                  value={chantierForm.nom}
                  onChange={(e) => setChantierForm((prev) => ({ ...prev, nom: e.target.value }))}
                  placeholder="Rénovation salle de bain"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chantier-client" className="text-foreground">Client</Label>
                <Select
                  value={chantierForm.clientId}
                  onValueChange={(value) => setChantierForm((prev) => ({ ...prev, clientId: value }))}
                >
                  <SelectTrigger id="chantier-client">
                    <SelectValue placeholder={dbClients.length ? "Choisir un client" : "Aucun client en base"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dbClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chantier-debut" className="text-foreground">Date début</Label>
                  <Input
                    id="chantier-debut"
                    type="date"
                    required
                    value={chantierForm.dateDebut}
                    onChange={(e) => setChantierForm((prev) => ({ ...prev, dateDebut: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chantier-fin" className="text-foreground">Date fin</Label>
                  <Input
                    id="chantier-fin"
                    type="date"
                    required
                    value={chantierForm.dateFin}
                    onChange={(e) => setChantierForm((prev) => ({ ...prev, dateFin: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chantier-couleur" className="text-foreground">Couleur</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="chantier-couleur"
                    type="color"
                    value={chantierForm.couleur}
                    onChange={(e) => setChantierForm((prev) => ({ ...prev, couleur: e.target.value }))}
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                  <span className="text-sm text-subtitle">{chantierForm.couleur}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chantier-statut" className="text-foreground">Statut</Label>
                <Select
                  value={chantierForm.statut}
                  onValueChange={(value: PlanningStatutLabel) =>
                    setChantierForm((prev) => ({ ...prev, statut: value }))
                  }
                >
                  <SelectTrigger id="chantier-statut">
                    <SelectValue placeholder="Choisir un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLANNING_STATUTS.map((statut) => (
                      <SelectItem key={statut} value={statut}>
                        {statut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <button
                  type="submit"
                  disabled={chantierSubmitting || !chantierForm.clientId}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    cursor: chantierSubmitting || !chantierForm.clientId ? "not-allowed" : "pointer",
                    fontWeight: 500,
                    opacity: chantierSubmitting || !chantierForm.clientId ? 0.7 : 1,
                  }}
                >
                  {chantierSubmitting ? "Enregistrement…" : "Ajouter le chantier"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Liste des chantiers du mois */}
        {chantiers.length > 0 && (
          <Card
            className="surface-card backdrop-blur-sm text-foreground"
            {...getHoverProps('planning_chantiers_mois')}
            style={getHoverStyle('planning_chantiers_mois', '#3b82f6')}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Chantiers du mois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chantiers
                  .filter(chantier => {
                    const startDate = new Date(chantier.dateDebut);
                    const endDate = calculateEndDate(chantier.dateDebut, chantier.duree);
                    return (
                      (startDate.getMonth() === month && startDate.getFullYear() === year) ||
                      (endDate.getMonth() === month && endDate.getFullYear() === year) ||
                      (startDate <= new Date(year, month + 1, 0) && endDate >= new Date(year, month, 1))
                    );
                  })
                  .map((chantier, chantierIndex) => {
                    const startDate = new Date(chantier.dateDebut);
                    const endDate = calculateEndDate(chantier.dateDebut, chantier.duree);
                    
                    return (
                      <div
                        key={chantier.id}
                        {...getHoverProps(`planning_chantier_${chantierIndex}`)}
                        style={getHoverStyle(`planning_chantier_${chantierIndex}`, '#f59e0b')}
                        className="p-3 rounded-lg bg-[#080d1a]/20 border border-border"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="h-4 w-4 text-subtitle" />
                              <span className="font-semibold">{chantier.nom}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                chantier.statut === 'planifié'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : chantier.statut === 'en cours'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-green-500/20 text-green-300'
                              }`}>
                                {chantier.statut}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-subtitle">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {chantier.clientName}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {startDate.toLocaleDateString('fr-FR')} - {endDate.toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </PageWrapper>
  );
}
