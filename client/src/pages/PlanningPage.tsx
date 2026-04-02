import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Building, Clock, User } from 'lucide-react';
import { useChantiers } from '@/context/ChantiersContext';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  
  // Fonction pour obtenir les chantiers d'un jour donné
  const getChantiersForDay = (date: Date) => {
    return chantiers.filter(chantier => {
      const startDate = new Date(chantier.dateDebut);
      const endDate = calculateEndDate(chantier.dateDebut, chantier.duree);
      
      // Normaliser les dates (ignorer l'heure)
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const chantierStart = new Date(startDate);
      chantierStart.setHours(0, 0, 0, 0);
      const chantierEnd = new Date(endDate);
      chantierEnd.setHours(23, 59, 59, 999);
      
      return dayStart >= chantierStart && dayStart <= chantierEnd;
    });
  };
  
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

  const dateKey = (d: Date) => d.toISOString().slice(0, 10)

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
        dateKey: dateKey(selectedDate),
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
              dateKey: dateKey(selectedDate),
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
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Planning des Chantiers
            </h1>
            <p className="text-sm text-white/70">Calendrier intégré pour organiser vos interventions</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* Contrôles du calendrier */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Calendar className="h-5 w-5 rotate-180" />
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={month}
                    onChange={(e) => setMonthYear(Number(e.target.value), year)}
                    className="h-10 min-w-[140px] rounded-xl bg-black/20 backdrop-blur-md border border-white/20 px-4 text-sm text-white shadow-sm outline-none transition-colors hover:bg-white/10 focus:ring-2 focus:ring-white/30"
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
                    className="h-10 w-[110px] rounded-xl bg-black/20 backdrop-blur-md border border-white/20 px-4 text-sm text-white shadow-sm outline-none transition-colors hover:bg-white/10 focus:ring-2 focus:ring-white/30"
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
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={handleTodayClick}
                className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors text-sm"
              >
                Aujourd'hui
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Calendrier */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardContent className="p-6">
            {/* En-têtes des jours */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-white/70 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grille du calendrier */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayChantiers = getChantiersForDay(day.date);
                const isToday = day.isToday;
                const dayCustomEvents = customEvents.filter((e) => e.dateKey === dateKey(day.date))
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 rounded-lg border ${
                      day.isCurrentMonth
                        ? isToday
                          ? 'bg-white/10 border-white/30 border-2'
                          : 'bg-black/10 border-white/10'
                        : 'bg-black/5 border-white/5 opacity-50'
                    } cursor-pointer hover:bg-white/10 transition-colors`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNewEvent(day.date)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openNewEvent(day.date)
                    }}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      day.isCurrentMonth ? 'text-white' : 'text-white/50'
                    } ${isToday ? 'text-white font-bold' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Rendez-vous (démo) */}
                    <div className="space-y-1 mb-1">
                      {dayCustomEvents.slice(0, 2).map((event, idx) => (
                        <div
                          key={event.id}
                          className="text-xs bg-black/20 backdrop-blur-md border border-white/10 text-white rounded px-1 py-0.5 truncate"
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
                        <div className="text-xs text-white/70">
                          +{dayCustomEvents.length - 2} autre(s)
                        </div>
                      )}
                    </div>

                    {/* Afficher les chantiers */}
                    <div className="space-y-1">
                      {dayChantiers.slice(0, 2).map(chantier => {
                        const startDate = new Date(chantier.dateDebut);
                        const isStart = day.date.toDateString() === startDate.toDateString();
                        const endDate = calculateEndDate(chantier.dateDebut, chantier.duree);
                        const isEnd = day.date.toDateString() === endDate.toDateString();
                        
                        return (
                          <div
                            key={chantier.id}
                            className={`text-xs p-1 rounded truncate ${
                              chantier.statut === 'planifié'
                                ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                                : chantier.statut === 'en cours'
                                ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-500/50'
                                : 'bg-green-500/30 text-green-200 border border-green-500/50'
                            }`}
                            title={`${chantier.nom} - ${chantier.clientName}`}
                          >
                            {isStart && '▶ '}
                            {isEnd && '◀ '}
                            {chantier.nom}
                          </div>
                        );
                      })}
                      {dayChantiers.length > 2 && (
                        <div className="text-xs text-white/70">
                          +{dayChantiers.length - 2} autre(s)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
          <DialogContent className="bg-black/30 backdrop-blur-xl border border-white/10 text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Nouveau rendez-vous</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="planning-event-date" className="text-white">Date</Label>
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
                    className="bg-black/20 border-white/10 text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shiftSelectedDateByDays(-1)}
                    className="text-white border-white/20 hover:bg-white/10 px-3"
                    disabled={!selectedDate}
                    title="Jour précédent"
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => shiftSelectedDateByDays(1)}
                    className="text-white border-white/20 hover:bg-white/10 px-3"
                    disabled={!selectedDate}
                    title="Jour suivant"
                  >
                    →
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning-event-time" className="text-white">Heure</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="planning-event-time"
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                  />
                  <div className="grid grid-rows-2 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => shiftTimeHours(1)}
                      className="text-white border-white/20 hover:bg-white/10 px-3 h-9 w-9"
                      title="Heure +1"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => shiftTimeHours(-1)}
                      className="text-white border-white/20 hover:bg-white/10 px-3 h-9 w-9"
                      title="Heure -1"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planning-event-title" className="text-white">Titre</Label>
                <Input
                  id="planning-event-title"
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="bg-black/20 border-white/10 text-white"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewEventOpen(false)}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Annuler
              </Button>
              {editingEventId ? (
                <>
                  <Button variant="outline" onClick={deleteEditedEvent} className="text-white border-white/20 hover:bg-white/10">
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

        {/* Légende */}
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Légende</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500/50"></div>
                <span className="text-sm">Planifié</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50"></div>
                <span className="text-sm">En cours</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50"></div>
                <span className="text-sm">Terminé</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des chantiers du mois */}
        {chantiers.length > 0 && (
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
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
                        className="p-3 rounded-lg bg-black/20 border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="h-4 w-4 text-white/70" />
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
                            <div className="flex items-center gap-4 text-sm text-white/70">
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
