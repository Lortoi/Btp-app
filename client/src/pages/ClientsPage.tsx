import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Plus, Building, Mail, Phone, Image as ImageIcon, Users, CheckCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCardHover } from '@/hooks/useCardHover';
import { useChantiers, Client } from '@/context/ChantiersContext';

const AVATAR_COLORS = ['#F5A623', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#e8702a', '#22c55e'];

function initialsFromNom(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return nom.slice(0, 2).toUpperCase();
}

function couleurFromNom(nom: string): string {
  let hash = 0;
  for (let i = 0; i < nom.length; i++) {
    hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function formatChantierCount(count: number): string {
  if (count === 0) return '0 chantier';
  if (count === 1) return '1 chantier';
  return `${count} chantiers`;
}

const KPI_CARD_STYLES: React.CSSProperties[] = [
  {
    borderLeft: '4px solid #3b82f6',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), transparent)',
  },
  {
    borderLeft: '4px solid #22c55e',
    background: 'linear-gradient(135deg, rgba(34,197,94,0.08), transparent)',
  },
  {
    borderLeft: '4px solid #e8702a',
    background: 'linear-gradient(135deg, rgba(232,112,42,0.08), transparent)',
  },
];

export default function ClientsPage() {
  const { clients, chantiers, addClient } = useChantiers();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
  const { getHoverProps, getHoverStyle } = useCardHover();

  // Filtrer les chantiers du client sélectionné
  const clientChantiers = selectedClient
    ? chantiers.filter(c => c.clientId === selectedClient.id)
    : [];

  const kpiStats = useMemo(() => {
    const actifs = clients.filter((client) =>
      chantiers.some((c) => c.clientId === client.id),
    ).length;
    return {
      total: clients.length,
      actifs,
      chantiersTotaux: chantiers.length,
    };
  }, [clients, chantiers]);

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email || !newClient.phone) return;

    const client: Client = {
      id: Date.now().toString(),
      ...newClient
    };

    addClient(client);
    setNewClient({ name: '', email: '', phone: '' });
    setIsDialogOpen(false);
  };

  return (
    <PageWrapper>
      <header className="surface-header backdrop-blur-sm px-6 py-4 rounded-tl-3xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full max-w-full">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Clients
            </h1>
            {selectedClient ? (
              <p className="text-sm text-subtitle">Chantiers de {selectedClient.name}</p>
            ) : null}
          </div>
          {!selectedClient && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Client
                </Button>
              </DialogTrigger>
              <DialogContent className="surface-card backdrop-blur-sm text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Nouveau Client</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Nom</Label>
                    <Input
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      placeholder="Nom du client"
                      className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground placeholder:text-gray-400 dark:placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Email</Label>
                    <Input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="email@example.com"
                      className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground placeholder:text-gray-400 dark:placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground">Téléphone</Label>
                    <Input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground placeholder:text-gray-400 dark:placeholder:text-white/50"
                    />
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
                      onClick={handleAddClient}
                      className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30"
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {selectedClient && (
            <Button
              variant="outline"
              onClick={() => setSelectedClient(null)}
              className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5"
            >
              Retour à la liste
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-x-hidden w-full max-w-full">
        {!selectedClient ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 w-full max-w-full">
            <Card
              className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full"
              {...getHoverProps('kpi_total_clients')}
              style={{
                ...KPI_CARD_STYLES[0],
                ...getHoverStyle('kpi_total_clients', '#3b82f6'),
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-subtitle" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{kpiStats.total}</div>
                <p className="text-xs text-subtitle">dans votre base</p>
              </CardContent>
            </Card>
            <Card
              className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full"
              {...getHoverProps('kpi_clients_actifs')}
              style={{
                ...KPI_CARD_STYLES[1],
                ...getHoverStyle('kpi_clients_actifs', '#22c55e'),
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                <CheckCircle className="h-4 w-4 text-subtitle" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{kpiStats.actifs}</div>
                <p className="text-xs text-subtitle">avec chantier en cours</p>
              </CardContent>
            </Card>
            <Card
              className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full"
              {...getHoverProps('kpi_chantiers_totaux')}
              style={{
                ...KPI_CARD_STYLES[2],
                ...getHoverStyle('kpi_chantiers_totaux', '#e8702a'),
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chantiers Totaux</CardTitle>
                <Building className="h-4 w-4 text-subtitle" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{kpiStats.chantiersTotaux}</div>
                <p className="text-xs text-subtitle">tous clients confondus</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
            {clients.map((client, index) => {
              const chantierCount = chantiers.filter((c) => c.clientId === client.id).length;
              const couleur = couleurFromNom(client.name);
              const isActif = chantierCount >= 1;

              return (
              <Card
                key={client.id}
                className="surface-card backdrop-blur-sm text-foreground relative overflow-hidden"
                {...getHoverProps(`client_${index}`)}
                style={{
                  borderLeft: `3px solid ${couleur}`,
                  ...getHoverStyle(`client_${index}`, couleur),
                }}
                onClick={() => setSelectedClient(client)}
              >
                <span
                  className="absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={
                    isActif
                      ? { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }
                      : { backgroundColor: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af' }
                  }
                >
                  {isActif ? 'Actif' : 'Inactif'}
                </span>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: couleur }}
                    >
                      {initialsFromNom(client.name)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-subtitle">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-subtitle">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-subtitle">
                      <Building className="h-4 w-4" />
                      {formatChantierCount(chantierCount)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
          </>
        ) : (
          <div>
            <Card
              className="surface-card backdrop-blur-sm text-foreground mb-6"
              {...getHoverProps('client_detail')}
              style={getHoverStyle('client_detail', '#3b82f6')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <User className="h-6 w-6 text-subtitle" />
                  </div>
                  <div>
                    <div className="text-xl">{selectedClient.name}</div>
                    <div className="text-sm font-normal text-subtitle">{selectedClient.email}</div>
                    <div className="text-sm font-normal text-subtitle">{selectedClient.phone}</div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            <h2 className="text-xl font-semibold text-foreground mb-4">Chantiers de {selectedClient.name}</h2>

            {clientChantiers.length === 0 ? (
              <Card
                className="surface-card backdrop-blur-sm text-foreground"
                {...getHoverProps('client_empty_chantiers')}
                style={getHoverStyle('client_empty_chantiers', '#f59e0b')}
              >
                <CardContent className="py-12 text-center">
                  <Building className="h-12 w-12 mx-auto mb-4 text-secondary" />
                  <p className="text-subtitle">Aucun chantier pour ce client</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
                {clientChantiers.map((chantier, index) => (
                  <Card
                    key={chantier.id}
                    className="surface-card backdrop-blur-sm text-foreground"
                    {...getHoverProps(`chantier_${index}`)}
                    style={getHoverStyle(`chantier_${index}`, '#f59e0b')}
                  >
                    {chantier.images.length > 0 && (
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={chantier.images[0]}
                          alt={chantier.nom}
                          className="w-full h-full object-cover"
                        />
                        {chantier.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-[#080d1a]/60 backdrop-blur-sm text-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {chantier.images.length}
                          </div>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-lg">{chantier.nom}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-subtitle">
                        Date: {new Date(chantier.dateDebut).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-subtitle">
                        Durée: {chantier.duree}
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
            )}
          </div>
        )}
      </main>
    </PageWrapper>
  );
}

