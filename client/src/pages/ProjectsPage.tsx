import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building,
  Plus,
  Calendar,
  Clock,
  User,
  Image as ImageIcon,
  X,
  Hammer,
  MapPin,
  HardHat,
  ClipboardList,
} from 'lucide-react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useChantiers, Chantier, Client } from '@/context/ChantiersContext';
import { Badge } from '@/components/ui/badge';

type MockStatutChantier = 'En cours' | 'Planifié' | 'Terminé';

interface MockChantier {
  id: string;
  nom: string;
  client: string;
  typeTravaux: string;
  localisation: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  statut: MockStatutChantier;
  avancement: number;
  couleur: string;
}

const mockChantiers: MockChantier[] = [
  {
    id: '1',
    nom: 'Rénovation salle de bain Levallois',
    client: 'Sophie Bernard',
    typeTravaux: 'Rénovation salle de bain',
    localisation: 'Levallois-Perret (92)',
    dateDebut: '2026-04-01',
    dateFin: '2026-04-12',
    montant: 18500,
    statut: 'En cours',
    avancement: 65,
    couleur: '#F5A623',
  },
  {
    id: '2',
    nom: 'Ravalement façade Neuilly',
    client: 'Pierre Leroy',
    typeTravaux: 'Ravalement façade',
    localisation: 'Neuilly-sur-Seine (92)',
    dateDebut: '2026-04-08',
    dateFin: '2026-04-28',
    montant: 32000,
    statut: 'En cours',
    avancement: 40,
    couleur: '#3B82F6',
  },
  {
    id: '3',
    nom: 'Extension maison Boulogne',
    client: 'Marie Martin',
    typeTravaux: 'Extension maison',
    localisation: 'Boulogne-Billancourt (92)',
    dateDebut: '2026-01-15',
    dateFin: '2026-03-20',
    montant: 42000,
    statut: 'Terminé',
    avancement: 100,
    couleur: '#10B981',
  },
  {
    id: '4',
    nom: 'Réfection toiture Issy-les-Moulineaux',
    client: 'SCI Les Pins',
    typeTravaux: 'Couverture / toiture',
    localisation: 'Issy-les-Moulineaux (92)',
    dateDebut: '2026-05-05',
    dateFin: '2026-05-22',
    montant: 28000,
    statut: 'Planifié',
    avancement: 0,
    couleur: '#8B5CF6',
  },
  {
    id: '5',
    nom: 'Carrelage cuisine Vincennes',
    client: 'Caroline Roche',
    typeTravaux: 'Carrelage et faïence',
    localisation: 'Vincennes (94)',
    dateDebut: '2026-05-18',
    dateFin: '2026-05-25',
    montant: 8500,
    statut: 'Planifié',
    avancement: 0,
    couleur: '#EF4444',
  },
];

function formatMontantEUR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' €';
}

const MOIS_COURTS_FR = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

function formatPeriodeCourte(debutIso: string, finIso: string): string {
  const [y1, m1, d1] = debutIso.split('-').map(Number);
  const [y2, m2, d2] = finIso.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return `${debutIso} → ${finIso}`;
  return `${d1} ${MOIS_COURTS_FR[m1 - 1]} → ${d2} ${MOIS_COURTS_FR[m2 - 1]}`;
}

function mockStatutBadgeClass(statut: MockStatutChantier): string {
  switch (statut) {
    case 'En cours':
      return 'bg-[#e8702a]/15 text-[#e8702a] rounded-full border-transparent';
    case 'Planifié':
      return 'bg-blue-500/15 text-blue-400 rounded-full border-transparent';
    case 'Terminé':
      return 'bg-green-500/15 text-green-400 rounded-full border-transparent';
    default:
      return 'bg-white/10 text-white/50 rounded-full border-transparent';
  }
}

export default function ProjectsPage() {
  const { chantiers, clients, addChantier, addClient } = useChantiers();
  const [location] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChantier, setNewChantier] = useState({
    nom: '',
    clientId: '',
    dateDebut: '',
    duree: '',
    images: [] as string[]
  });
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) {
            setNewChantier(prev => ({
              ...prev,
              images: [...prev.images, result as string]
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const removeImage = (index: number) => {
    setNewChantier(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddChantier = () => {
    if (!newChantier.nom || !newChantier.clientId || !newChantier.dateDebut || !newChantier.duree) {
      return;
    }

    const client = clients.find(c => c.id === newChantier.clientId);
    const chantier: Chantier = {
      id: Date.now().toString(),
      nom: newChantier.nom,
      clientId: newChantier.clientId,
      clientName: client?.name || 'Client inconnu',
      dateDebut: newChantier.dateDebut,
      duree: newChantier.duree,
      images: newChantier.images,
      statut: 'planifié'
    };

    addChantier(chantier);
    setNewChantier({ nom: '', clientId: '', dateDebut: '', duree: '', images: [] });
    setUploadedImages([]);
    setIsDialogOpen(false);
  };

  const handleAddClient = () => {
    const newClient: Client = {
      id: Date.now().toString(),
      name: `Client ${clients.length + 1}`,
      email: '',
      phone: ''
    };
    addClient(newClient);
    setNewChantier(prev => ({ ...prev, clientId: newClient.id }));
  };

  // Ouvrir la popup si le paramètre openDialog est présent dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openDialog') === 'true') {
      setIsDialogOpen(true);
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/dashboard/projects');
    }
  }, [location]);

  const kpiMock = useMemo(() => {
    const total = mockChantiers.length;
    const enCours = mockChantiers.filter((c) => c.statut === 'En cours').length;
    const planifie = mockChantiers.filter((c) => c.statut === 'Planifié').length;
    return { total, enCours, planifie };
  }, []);

  return (
    <PageWrapper>
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full max-w-full">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mes Chantiers
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Link href="/dashboard/clients" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5">
                <User className="h-4 w-4 mr-2" />
                Clients
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Chantier
                </Button>
              </DialogTrigger>
              <DialogContent className="surface-card backdrop-blur-sm text-foreground max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Nouveau Chantier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Nom du chantier</Label>
                    <Input
                      value={newChantier.nom}
                      onChange={(e) => setNewChantier({ ...newChantier, nom: e.target.value })}
                      placeholder="Ex: Rénovation salle de bain"
                      className="bg-gray-50 dark:bg-black/20 border-border text-foreground placeholder:text-gray-400 dark:placeholder:text-white/50"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Client</Label>
                    <div className="flex gap-2">
                      <Select
                        value={newChantier.clientId}
                        onValueChange={(value) => setNewChantier({ ...newChantier, clientId: value })}
                      >
                        <SelectTrigger className="bg-gray-50 dark:bg-black/20 backdrop-blur-md border-border text-foreground">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black/20 backdrop-blur-xl border border-border text-foreground">
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id} className="text-foreground">
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddClient}
                        className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-foreground">Date de début</Label>
                      <Input
                        type="date"
                        value={newChantier.dateDebut}
                        onChange={(e) => setNewChantier({ ...newChantier, dateDebut: e.target.value })}
                        className="bg-gray-50 dark:bg-black/20 backdrop-blur-md border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground">Durée</Label>
                      <Input
                        value={newChantier.duree}
                        onChange={(e) => setNewChantier({ ...newChantier, duree: e.target.value })}
                        placeholder="Ex: 2 semaines"
                        className="bg-gray-50 dark:bg-black/20 border-border text-foreground placeholder:text-gray-400 dark:placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground">Images</Label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="chantier-images"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('chantier-images')?.click()}
                      className="w-full text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Ajouter des images
                    </Button>
                    {newChantier.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {newChantier.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-300 dark:border-white/20"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddChantier}
                      disabled={!newChantier.nom || !newChantier.clientId || !newChantier.dateDebut || !newChantier.duree}
                      className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30 disabled:opacity-50"
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden w-full max-w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-full">
          <Card className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chantiers</CardTitle>
              <Building className="h-4 w-4 text-subtitle" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiMock.total}</div>
              <p className="text-xs text-subtitle">total</p>
            </CardContent>
          </Card>
          <Card className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <HardHat className="h-4 w-4 text-subtitle" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiMock.enCours}</div>
              <p className="text-xs text-subtitle">chantiers actifs</p>
            </CardContent>
          </Card>
          <Card className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
              <ClipboardList className="h-4 w-4 text-subtitle" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiMock.planifie}</div>
              <p className="text-xs text-subtitle">à démarrer</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-subtitle mb-3">Aperçu chantiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full">
            {mockChantiers.map((c) => (
              <Card
                key={c.id}
                className="surface-card backdrop-blur-sm text-foreground overflow-hidden flex flex-col border-l-4 shadow-none w-full max-w-full"
                style={{ borderLeftColor: c.couleur }}
              >
                <CardHeader className="pb-2 space-y-0">
                  <div className="flex items-start justify-between gap-2 pr-0">
                    <CardTitle className="text-base font-bold leading-tight pr-2">{c.nom}</CardTitle>
                    <Badge variant="outline" className={`shrink-0 border ${mockStatutBadgeClass(c.statut)}`}>
                      {c.statut}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <User className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                      <span>{c.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Hammer className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                      <span>{c.typeTravaux}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <MapPin className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                      <span>{c.localisation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                      <span>{formatPeriodeCourte(c.dateDebut, c.dateFin)}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-[#F5A623]">{formatMontantEUR(c.montant)}</p>
                  <div className="space-y-1">
                    <div className="flex justify-end">
                      <span className="text-xs text-secondary">{c.avancement}% réalisé</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${c.avancement}%`,
                          backgroundColor: c.couleur,
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 mt-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5"
                    >
                      Voir le chantier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {chantiers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-subtitle">Chantiers enregistrés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
              {chantiers.map((chantier) => (
                <Card
                  key={chantier.id}
                  className="surface-card backdrop-blur-sm text-foreground hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {chantier.images.length > 0 && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={chantier.images[0]}
                        alt={chantier.nom}
                        className="w-full h-full object-cover"
                      />
                      {chantier.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {chantier.images.length}
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{chantier.nom}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-subtitle">
                      <User className="h-4 w-4" />
                      {chantier.clientName}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-subtitle">
                      <Calendar className="h-4 w-4" />
                      {new Date(chantier.dateDebut).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-subtitle">
                      <Clock className="h-4 w-4" />
                      {chantier.duree}
                    </div>
                    <div className="mt-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${
                        chantier.statut === 'planifié' ? 'bg-blue-500/15 text-blue-400' :
                        chantier.statut === 'en cours' ? 'bg-[#e8702a]/15 text-[#e8702a]' :
                        'bg-green-500/15 text-green-400'
                      }`}>
                        {chantier.statut}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </PageWrapper>
  );
}
