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
    nom: 'Rénovation Dupont',
    client: 'Jean Dupont',
    typeTravaux: 'Rénovation cuisine',
    localisation: 'Paris 15e',
    dateDebut: '2026-04-01',
    dateFin: '2026-04-08',
    montant: 18500,
    statut: 'En cours',
    avancement: 60,
    couleur: '#F97316',
  },
  {
    id: '2',
    nom: 'Extension Martin',
    client: 'Marie Martin',
    typeTravaux: 'Extension maison',
    localisation: 'Versailles',
    dateDebut: '2026-04-03',
    dateFin: '2026-04-11',
    montant: 45000,
    statut: 'En cours',
    avancement: 35,
    couleur: '#3B82F6',
  },
  {
    id: '3',
    nom: 'Maçonnerie Résidence Les Pins',
    client: 'SCI Les Pins',
    typeTravaux: 'Maçonnerie',
    localisation: 'Boulogne-Billancourt',
    dateDebut: '2026-04-07',
    dateFin: '2026-04-18',
    montant: 92000,
    statut: 'En cours',
    avancement: 20,
    couleur: '#10B981',
  },
  {
    id: '4',
    nom: 'Plomberie Immeuble Voltaire',
    client: 'Syndic Voltaire',
    typeTravaux: 'Plomberie collective',
    localisation: 'Paris 11e',
    dateDebut: '2026-04-14',
    dateFin: '2026-04-17',
    montant: 28000,
    statut: 'En cours',
    avancement: 80,
    couleur: '#8B5CF6',
  },
  {
    id: '5',
    nom: 'Ravalement Façade Leblanc',
    client: 'Pierre Leroy',
    typeTravaux: 'Ravalement façade',
    localisation: 'Neuilly-sur-Seine',
    dateDebut: '2026-04-22',
    dateFin: '2026-04-30',
    montant: 12000,
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
      return 'bg-[#F97316]/20 text-orange-100 border-[#F97316]/40';
    case 'Planifié':
      return 'bg-[#3B82F6]/20 text-blue-100 border-[#3B82F6]/40';
    case 'Terminé':
      return 'bg-[#10B981]/20 text-emerald-100 border-[#10B981]/40';
    default:
      return 'bg-white/10 text-white/80';
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
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Mes Chantiers
            </h1>
            <p className="text-sm text-white/70">Gérez tous vos projets en cours et terminés</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/clients">
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                <User className="h-4 w-4 mr-2" />
                Clients
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Chantier
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/20 backdrop-blur-xl border border-white/10 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Nouveau Chantier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Nom du chantier</Label>
                    <Input
                      value={newChantier.nom}
                      onChange={(e) => setNewChantier({ ...newChantier, nom: e.target.value })}
                      placeholder="Ex: Rénovation salle de bain"
                      className="bg-black/20 backdrop-blur-md border-white/10 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Client</Label>
                    <div className="flex gap-2">
                      <Select
                        value={newChantier.clientId}
                        onValueChange={(value) => setNewChantier({ ...newChantier, clientId: value })}
                      >
                        <SelectTrigger className="bg-black/20 backdrop-blur-md border-white/10 text-white">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/20 backdrop-blur-xl border-white/10">
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id} className="text-white">
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddClient}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Date de début</Label>
                      <Input
                        type="date"
                        value={newChantier.dateDebut}
                        onChange={(e) => setNewChantier({ ...newChantier, dateDebut: e.target.value })}
                        className="bg-black/20 backdrop-blur-md border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Durée</Label>
                      <Input
                        value={newChantier.duree}
                        onChange={(e) => setNewChantier({ ...newChantier, duree: e.target.value })}
                        placeholder="Ex: 2 semaines"
                        className="bg-black/20 backdrop-blur-md border-white/10 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white">Images</Label>
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
                      className="w-full text-white border-white/20 hover:bg-white/10"
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
                              className="w-full h-20 object-cover rounded-lg border border-white/20"
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
                      className="text-white border-white/20 hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddChantier}
                      disabled={!newChantier.nom || !newChantier.clientId || !newChantier.dateDebut || !newChantier.duree}
                      className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30 disabled:opacity-50"
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

      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chantiers</CardTitle>
              <Building className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiMock.total}</div>
              <p className="text-xs text-white/70">total (démo)</p>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <HardHat className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiMock.enCours}</div>
              <p className="text-xs text-white/70">chantiers actifs</p>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planifiés</CardTitle>
              <ClipboardList className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiMock.planifie}</div>
              <p className="text-xs text-white/70">à démarrer</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white/80 mb-3">Aperçu chantiers (démo)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockChantiers.map((c) => (
              <Card
                key={c.id}
                className="bg-black/20 backdrop-blur-xl border border-white/10 text-white overflow-hidden flex flex-col border-l-4 shadow-none"
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
                    <div className="flex items-center gap-2 text-white/90">
                      <User className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                      <span>{c.client}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Hammer className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                      <span>{c.typeTravaux}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                      <span>{c.localisation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                      <Calendar className="h-4 w-4 shrink-0 text-white/55" aria-hidden />
                      <span>{formatPeriodeCourte(c.dateDebut, c.dateFin)}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-[#F97316]">{formatMontantEUR(c.montant)}</p>
                  <div className="space-y-1">
                    <div className="flex justify-end">
                      <span className="text-xs text-white/60">{c.avancement}% réalisé</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
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
                      className="w-full text-white border-white/20 hover:bg-white/10"
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
            <h2 className="text-sm font-semibold text-white/80">Chantiers enregistrés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chantiers.map((chantier) => (
                <Card
                  key={chantier.id}
                  className="bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:shadow-lg transition-shadow cursor-pointer"
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
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <User className="h-4 w-4" />
                      {chantier.clientName}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Calendar className="h-4 w-4" />
                      {new Date(chantier.dateDebut).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Clock className="h-4 w-4" />
                      {chantier.duree}
                    </div>
                    <div className="mt-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        chantier.statut === 'planifié' ? 'bg-blue-500/20 text-blue-300' :
                        chantier.statut === 'en cours' ? 'bg-green-500/20 text-green-300' :
                        'bg-gray-500/20 text-gray-300'
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
