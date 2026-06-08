import { createContext, useContext, useState, ReactNode } from 'react';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Chantier {
  id: string;
  nom: string;
  clientId: string;
  clientName: string;
  dateDebut: string;
  duree: string;
  images: string[];
  statut: 'planifié' | 'en cours' | 'terminé';
}

interface ChantiersContextType {
  clients: Client[];
  chantiers: Chantier[];
  addClient: (client: Client) => void;
  addChantier: (chantier: Chantier) => void;
  updateChantier: (id: string, updates: Partial<Chantier>) => void;
}

const ChantiersContext = createContext<ChantiersContextType | undefined>(undefined);

export function ChantiersProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([
    { id: '1', name: 'Sophie Bernard', email: 'sophie.bernard@gmail.com', phone: '06 14 25 36 47' },
    { id: '2', name: 'Marie Martin', email: 'marie.martin@email.com', phone: '07 68 92 15 03' },
    { id: '3', name: 'SCI Les Pins', email: 'contact@lespins.fr', phone: '01 45 72 33 18' },
    { id: '4', name: 'Pierre Leroy', email: 'p.leroy@gmail.com', phone: '06 82 41 67 90' },
  ]);
  const [chantiers, setChantiers] = useState<Chantier[]>([
    {
      id: '1',
      nom: 'Rénovation salle de bain Levallois',
      clientId: '1',
      clientName: 'Sophie Bernard',
      dateDebut: '2026-04-01',
      duree: '2 semaines',
      images: [],
      statut: 'en cours',
    },
    {
      id: '2',
      nom: 'Ravalement façade Neuilly',
      clientId: '4',
      clientName: 'Pierre Leroy',
      dateDebut: '2026-04-08',
      duree: '3 semaines',
      images: [],
      statut: 'en cours',
    },
    {
      id: '3',
      nom: 'Extension maison Boulogne',
      clientId: '2',
      clientName: 'Marie Martin',
      dateDebut: '2026-01-15',
      duree: '9 semaines',
      images: [],
      statut: 'terminé',
    },
    {
      id: '4',
      nom: 'Réfection toiture Issy-les-Moulineaux',
      clientId: '3',
      clientName: 'SCI Les Pins',
      dateDebut: '2026-05-05',
      duree: '2 semaines',
      images: [],
      statut: 'planifié',
    },
    {
      id: '5',
      nom: 'Carrelage cuisine Vincennes',
      clientId: '2',
      clientName: 'Marie Martin',
      dateDebut: '2026-05-18',
      duree: '1 semaine',
      images: [],
      statut: 'planifié',
    },
  ]);

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const addChantier = (chantier: Chantier) => {
    setChantiers(prev => [...prev, chantier]);
  };

  const updateChantier = (id: string, updates: Partial<Chantier>) => {
    setChantiers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <ChantiersContext.Provider value={{ clients, chantiers, addClient, addChantier, updateChantier }}>
      {children}
    </ChantiersContext.Provider>
  );
}

export function useChantiers() {
  const context = useContext(ChantiersContext);
  if (context === undefined) {
    throw new Error('useChantiers must be used within a ChantiersProvider');
  }
  return context;
}

