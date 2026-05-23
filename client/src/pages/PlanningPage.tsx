import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Building, Clock, User } from 'lucide-react';
import { useChantiers } from '@/context/ChantiersContext';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Chantiers fictifs BTP — avril / mai 2026 (données mock, hors composant) */
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
    nom: "Rénovation Dupont",
    dateDebut: "2026-04-01",
    dateFin: "2026-04-08",
    couleur: "#F97316",
    client: "SCI Dupont",
    statut: "En cours",
  },
  {
    id: "mock-2",
    nom: "Extension Martin",
    dateDebut: "2026-04-03",
    dateFin: "2026-04-11",
    couleur: "#3B82F6",
    client: "Famille Martin",
    statut: "En cours",
  },
  {
    id: "mock-3",
    nom: "Maçonnerie Résidence Les Pins",
    dateDebut: "2026-04-07",
    dateFin: "2026-04-18",
    couleur: "#10B981",
    client: "Promo Habitat Sud",
    statut: "Planifié",
  },
  {
    id: "mock-4",
    nom: "Plomberie Immeuble Voltaire",
    dateDebut: "2026-04-14",
    dateFin: "2026-04-17",
    couleur: "#8B5CF6",
    client: "Syndic Voltaire 12",
    statut: "En cours",
  },
  {
    id: "mock-5",
    nom: "Ravalement facade Leblanc",
    dateDebut: "2026-04-22",
    dateFin: "2026-04-30",
    couleur: "#EF4444",
    client: "M. Leblanc",
    statut: "Planifié",
  },
  {
    id: "mock-6",
    nom: "Couverture Zinguerie Les Oliviers",
    dateDebut: "2026-05-02",
    dateFin: "2026-05-10",
    couleur: "#F97316",
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

function getMockChantiersForDay(dayYmd: string): MockPlanningChantier[] {
  return mockChantiers.filter((c) => isYmdInRange(dayYmd, c.dateDebut, c.dateFin))
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

function barDisplayName(nom: string, isStart: boolean): string {
  if (isStart) return nom
  return nom.length > 20 ? `${nom.slice(0, 20)}...` : nom
}

function barRoundedClass(isStart: boolean, isEnd: boolean): string {
  if (isStart && isEnd) return "rounded-full"
  if (isStart) return "rounded-l-full"
  if (isEnd) return "rounded-r-full"
  return "rounded-none"
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNewEventOpen, setIsNewEventOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [datePickerKey, setDatePickerKey] = useState(0)
  const [newEventTime, setNewEventTime] = useState("11:30")
  const [newEventTitle, setNewEventTitle] = useState("Rendez-vous")
  const [customEvents, setCustomEvents] = useState<Array<{ id: string; dateKey: string; time: string; title: string }>>([])
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

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
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-gray-600 px-6 py-4 rounded-tl-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Planning des Chantiers
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Calendrier intégré pour organiser vos interventions</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* Contrôles du calendrier */}
        <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:bg-white/10 transition-colors"
                >
                  <Calendar className="h-5 w-5 rotate-180" />
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={month}
                    onChange={(e) => setMonthYear(Number(e.target.value), year)}
                    className="h-10 min-w-[140px] rounded-xl bg-black/20 backdrop-blur-md border border-gray-300 dark:border-white/20 px-4 text-sm text-gray-900 dark:text-white shadow-sm outline-none transition-colors hover:bg-gray-100 dark:bg-white/10 focus:ring-2 focus:ring-white/30"
                    aria-label="Mois"
                  >
                    {monthNames.map((mName, idx) => (
                      <option key={mName} value={idx}>
                        {mName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setMonthYear(month, Number(e.target.value))}
                    className="h-10 w-[110px] rounded-xl bg-black/20 backdrop-blur-md border border-gray-300 dark:border-white/20 px-4 text-sm text-gray-900 dark:text-white shadow-sm outline-none transition-colors hover:bg-gray-100 dark:bg-white/10 focus:ring-2 focus:ring-white/30"
                    aria-label="Année"
                  >
                    {Array.from({ length: 11 }, (_, i) => year - 5 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={goToNextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:bg-white/10 transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={handleTodayClick}
                className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-gray-900 dark:text-white hover:bg-white/30 transition-colors text-sm"
              >
                Aujourd'hui
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Calendrier */}
        <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
          <CardContent className="p-6">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayYmd = dateToYmd(day.date)
                const mockForDay = getMockChantiersForDay(dayYmd)
                const isToday = day.isToday;
                const dayCustomEvents = customEvents.filter((e) => e.dateKey === dateToYmd(day.date))
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 rounded-lg border ${
                      day.isCurrentMonth
                        ? isToday
                          ? 'bg-gray-100 dark:bg-white/10 border-white/30 border-2'
                          : 'bg-black/10 border-gray-300 dark:border-gray-600'
                        : 'bg-black/5 border-white/5 opacity-50'
                    } cursor-pointer hover:bg-gray-100 dark:bg-white/10 transition-colors`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNewEvent(day.date)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openNewEvent(day.date)
                    }}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      day.isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    } ${isToday ? 'text-gray-900 dark:text-white font-bold' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Rendez-vous (démo) */}
                    <div className="space-y-1 mb-1">
                      {dayCustomEvents.slice(0, 2).map((event, idx) => (
                        <div
                          key={event.id}
                          className="text-xs bg-gray-50 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded px-1 py-0.5 truncate"
                          title={`${event.time} - ${event.title}`}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditEvent(event)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation()
                              openEditEvent(event)
                            }
                          }}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                      {dayCustomEvents.length > 2 && (
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          +{dayCustomEvents.length - 2} autre(s)
                        </div>
                      )}
                    </div>

                    {/* Chantiers mock (barres colorées) */}
                    <div className="flex flex-col gap-0.5 mt-1">
                      {mockForDay.map((chantier) => {
                        const isStart = dayYmd === chantier.dateDebut
                        const isEnd = dayYmd === chantier.dateFin
                        const rounded = barRoundedClass(isStart, isEnd)
                        const label = barDisplayName(chantier.nom, isStart)
                        return (
                          <Popover key={chantier.id}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={`w-full text-left text-xs text-gray-900 dark:text-white px-1 py-0.5 min-h-0 truncate ${rounded}`}
                                style={{ backgroundColor: chantier.couleur }}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") e.stopPropagation()
                                }}
                              >
                                {label}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-72 bg-white dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white shadow-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-2 text-sm">
                                <p className="font-semibold leading-tight">{chantier.nom}</p>
                                <p className="text-gray-600 dark:text-gray-300">
                                  <span className="text-gray-500 dark:text-gray-400">Client : </span>
                                  {chantier.client}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 text-xs">
                                  <span className="text-gray-500 dark:text-gray-400">Période : </span>
                                  {formatRangeFr(chantier.dateDebut, chantier.dateFin)}
                                </p>
                                <p className="text-xs">
                                  <span className="text-gray-500 dark:text-gray-400">Statut : </span>
                                  {chantier.statut}
                                </p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Légende chantiers (démo)
              </p>
              <div className="flex flex-wrap gap-3">
                {mockChantiers.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                    <span
                      className="shrink-0 w-4 h-4 rounded-sm border border-gray-300 dark:border-white/20 shadow-inner"
                      style={{ backgroundColor: c.couleur }}
                      aria-hidden
                    />
                    <span className="font-medium">{c.nom}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      {formatLegendPeriod(c.dateDebut, c.dateFin)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
          <DialogContent className="bg-black/30 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Nouveau rendez-vous</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="planning-event-date" className="text-gray-900 dark:text-white">Date</Label>
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
                    className="bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shiftSelectedDateByDays(-1)}
                    className="text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 px-3"
                    disabled={!selectedDate}
                    title="Jour précédent"
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shiftSelectedDateByDays(1)}
                    className="text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 px-3"
                    disabled={!selectedDate}
                    title="Jour suivant"
                  >
                    →
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning-event-time" className="text-gray-900 dark:text-white">Heure</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="planning-event-time"
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                  <div className="grid grid-rows-2 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => shiftTimeHours(1)}
                      className="text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 px-3 h-9 w-9"
                      title="Heure +1"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => shiftTimeHours(-1)}
                      className="text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 px-3 h-9 w-9"
                      title="Heure -1"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning-event-title" className="text-gray-900 dark:text-white">Titre</Label>
                <Input
                  id="planning-event-title"
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewEventOpen(false)}
                className="text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                Annuler
              </Button>
              {editingEventId ? (
                <>
                  <Button variant="outline" onClick={deleteEditedEvent} className="text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10">
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

        {/* Liste des chantiers du mois */}
        {chantiers.length > 0 && (
          <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
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
                  .map(chantier => {
                    const startDate = new Date(chantier.dateDebut);
                    const endDate = calculateEndDate(chantier.dateDebut, chantier.duree);
                    
                    return (
                      <div
                        key={chantier.id}
                        className="p-3 rounded-lg bg-black/20 border border-gray-300 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="h-4 w-4 text-gray-600 dark:text-gray-300" />
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
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
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
