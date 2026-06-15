import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Plus,
  User,
  Mail,
  Phone,
  Trash2,
  Key,
  Edit2,
  HardHat,
  Check,
  Copy,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useCardHover } from '@/hooks/useCardHover';
import { fetchTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember, type TeamMember } from '@/lib/supabase';

type MembreStatut = 'Disponible' | 'En chantier' | 'Absent';

interface MockEquipeMember {
  id: string;
  nom: string;
  role: string;
  telephone: string;
  chantiers: string[];
  statut: MembreStatut;
  couleurAvatar: string;
}

const mockEquipe: MockEquipeMember[] = [
  {
    id: 'mock-1',
    nom: 'Marc Dubois',
    role: 'Maçon',
    telephone: '06 14 82 37 56',
    chantiers: ['Rénovation salle de bain Levallois', 'Ravalement façade Neuilly'],
    statut: 'En chantier',
    couleurAvatar: '#F5A623',
  },
  {
    id: 'mock-2',
    nom: 'Youssef El Amrani',
    role: 'Plombier',
    telephone: '07 63 28 91 04',
    chantiers: ['Rénovation salle de bain Levallois'],
    statut: 'En chantier',
    couleurAvatar: '#3B82F6',
  },
  {
    id: 'mock-3',
    nom: 'Sébastien Morel',
    role: 'Électricien',
    telephone: '06 51 74 29 88',
    chantiers: ['Carrelage cuisine Vincennes'],
    statut: 'Disponible',
    couleurAvatar: '#10B981',
  },
];

function initialsFromNom(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return nom.slice(0, 2).toUpperCase();
}

function statutBadgeStyle(statut: MembreStatut): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: '9999px',
    padding: '2px 10px',
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };
  switch (statut) {
    case 'Disponible':
      return {
        ...base,
        background: 'rgba(34,197,94,0.15)',
        color: '#4ade80',
        border: '1px solid rgba(34,197,94,0.3)',
      };
    case 'En chantier':
      return {
        ...base,
        background: 'rgba(124,58,237,0.15)',
        color: '#a78bfa',
        border: '1px solid rgba(124,58,237,0.3)',
      };
    case 'Absent':
      return {
        ...base,
        background: 'rgba(239,68,68,0.15)',
        color: '#f87171',
        border: '1px solid rgba(239,68,68,0.3)',
      };
    default:
      return base;
  }
}

const CHANTIER_PILL_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '6px',
  padding: '2px 8px',
  fontSize: '12px',
};

const PROFILE_BUTTON_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))',
  border: '1px solid rgba(124,58,237,0.3)',
  color: '#a78bfa',
  borderRadius: '8px',
  width: '100%',
  padding: '8px',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
};

const KPI_CARD_STYLES: React.CSSProperties[] = [
  {
    borderLeft: '4px solid #3b82f6',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.08), transparent)',
  },
  {
    borderLeft: '4px solid #7c3aed',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.08), transparent)',
  },
  {
    borderLeft: '4px solid #22c55e',
    background: 'linear-gradient(135deg, rgba(34,197,94,0.08), transparent)',
  },
];

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    login_code: ''
  });
  const { getHoverProps, getHoverStyle } = useCardHover();

  const kpiStats = useMemo(() => {
    const enChantier = mockEquipe.filter((m) => m.statut === 'En chantier').length;
    const disponibles = mockEquipe.filter((m) => m.statut === 'Disponible').length;
    return {
      total: mockEquipe.length,
      enChantier,
      disponibles,
    };
  }, []);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await fetchTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role || !newMember.email || !newMember.login_code) {
      alert("Veuillez remplir tous les champs, y compris le code de connexion");
      return;
    }

    const result = await createTeamMember({
      name: newMember.name,
      role: newMember.role,
      email: newMember.email,
      phone: newMember.phone || null,
      status: 'actif',
      login_code: newMember.login_code,
    });

    if (result) {
      const { createTeamInvitation } = await import('@/lib/supabase');
      const { inviteLink } = await createTeamInvitation(result.id, result.email);

      if (inviteLink) {
        setInviteLink(inviteLink);
        setShowInviteModal(true);
      }

      await loadMembers();
      setNewMember({ name: '', role: '', email: '', phone: '', login_code: '' });
      setIsDialogOpen(false);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsEditDialogOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    const result = await updateTeamMember(editingMember.id, {
      name: editingMember.name,
      role: editingMember.role,
      email: editingMember.email,
      phone: editingMember.phone,
      status: editingMember.status,
      login_code: editingMember.login_code,
    });

    if (result) {
      await loadMembers();
      setEditingMember(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      const success = await deleteTeamMember(id);
      if (success) {
        await loadMembers();
      }
    }
  };

  return (
    <PageWrapper>
      <header className="surface-header backdrop-blur-sm px-6 py-4 rounded-tl-3xl">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full max-w-full">
          <div>
            <h1
              className="text-2xl text-white font-bold tracking-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              Gestion de l'Équipe
            </h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-[#e8702a] hover:bg-[#d2611f] text-white rounded-xl hover:shadow-lg hover:shadow-[#e8702a]/20 border-0">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Membre
              </Button>
            </DialogTrigger>
            <DialogContent className="surface-card backdrop-blur-sm text-foreground rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Ajouter un Nouveau Membre</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Nom complet</Label>
                  <Input
                    id="name"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground">Rôle</Label>
                  <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#080d1a]/30 backdrop-blur-lg border border-border text-foreground">
                      <SelectItem value="Chef de chantier">Chef de chantier</SelectItem>
                      <SelectItem value="Ouvrier">Ouvrier</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Assistant">Assistant</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                    placeholder="jean.dupont@planchais.fr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login_code" className="text-foreground">Code de connexion *</Label>
                  <Input
                    id="login_code"
                    value={newMember.login_code}
                    onChange={(e) => setNewMember(prev => ({ ...prev, login_code: e.target.value }))}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground font-mono"
                    placeholder="Entrez le code de connexion"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5">
                  Annuler
                </Button>
                <Button onClick={handleAddMember}>Ajouter le Membre</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden w-full max-w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-full">
          <Card
            className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full"
            {...getHoverProps('kpi_membres')}
            style={{
              ...KPI_CARD_STYLES[0],
              ...getHoverStyle('kpi_membres', '#3b82f6'),
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres</CardTitle>
              <Users className="h-4 w-4 text-subtitle" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{kpiStats.total}</div>
              <p className="text-xs text-subtitle">total</p>
            </CardContent>
          </Card>
          <Card
            className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full"
            {...getHoverProps('kpi_en_chantier')}
            style={{
              ...KPI_CARD_STYLES[1],
              ...getHoverStyle('kpi_en_chantier', '#7c3aed'),
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En chantier</CardTitle>
              <HardHat className="h-4 w-4 text-subtitle" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{kpiStats.enChantier}</div>
              <p className="text-xs text-subtitle">sur le terrain</p>
            </CardContent>
          </Card>
          <Card
            className="surface-card backdrop-blur-sm text-foreground flex-1 min-w-0 max-w-full"
            {...getHoverProps('kpi_disponibles')}
            style={{
              ...KPI_CARD_STYLES[2],
              ...getHoverStyle('kpi_disponibles', '#22c55e'),
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Check className="h-4 w-4 text-subtitle" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{kpiStats.disponibles}</div>
              <p className="text-xs text-subtitle">prêts à affecter</p>
            </CardContent>
          </Card>
        </div>

        <Card
          className="surface-card backdrop-blur-sm text-foreground max-w-full"
          {...getHoverProps('team_list_wrapper')}
          style={getHoverStyle('team_list_wrapper', '#3b82f6')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-subtitle" />
              Membres de l'Équipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 w-full max-w-full">
              {mockEquipe.map((m, index) => (
                <Card
                  key={m.id}
                  className="surface-card backdrop-blur-sm text-foreground overflow-hidden p-4"
                  {...getHoverProps(`member_${index}`)}
                  style={getHoverStyle(`member_${index}`, m.couleurAvatar)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{
                          backgroundColor: m.couleurAvatar,
                          boxShadow: `0 0 0 2px ${m.couleurAvatar}`,
                        }}
                      >
                        {initialsFromNom(m.nom)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold leading-tight text-foreground">{m.nom}</p>
                        <p className="truncate text-sm text-secondary">{m.role}</p>
                      </div>
                    </div>
                    <span style={statutBadgeStyle(m.statut)}>{m.statut}</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="h-4 w-4 shrink-0 text-subtitle" aria-hidden />
                      <span>{m.telephone}</span>
                    </div>
                    {m.chantiers.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {m.chantiers.map((c) => (
                          <span key={c} style={CHANTIER_PILL_STYLE}>
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-secondary italic">Aucun chantier assigné</p>
                    )}
                  </div>

                  <button
                    type="button"
                    style={PROFILE_BUTTON_STYLE}
                    className="mt-3 text-sm font-medium"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)';
                    }}
                  >
                    Voir le profil
                  </button>
                </Card>
              ))}
            </div>

            {!loading && members.length > 0 && (
              <div className="border-t border-border pt-6 space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-subtitle">Membres enregistrés</p>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={member.id}
                      {...getHoverProps(`member_registered_${index}`)}
                      style={getHoverStyle(`member_registered_${index}`, '#3b82f6')}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-md border border-border rounded-lg hover:bg-[#080d1a]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 backdrop-blur-md flex items-center justify-center">
                          <User className="h-6 w-6 text-subtitle" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-subtitle">{member.role}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-xs text-secondary">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-1 text-xs text-secondary">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-secondary">
                              <Key className="h-3 w-3" />
                              <span className="font-mono">{member.login_code}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={member.status === 'actif' ? 'bg-green-500/15 text-green-400 rounded-full' : 'bg-white/10 text-white/50 rounded-full'}>
                          {member.status === 'actif' ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                          className="text-subtitle hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-subtitle hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-900 dark:hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="surface-card backdrop-blur-sm text-foreground rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Modifier le Membre</DialogTitle>
            </DialogHeader>
            {editingMember && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-foreground">Nom complet</Label>
                  <Input
                    id="edit-name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-foreground">Rôle</Label>
                  <Select 
                    value={editingMember.role} 
                    onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#080d1a]/30 backdrop-blur-lg border border-border text-foreground">
                      <SelectItem value="Chef de chantier">Chef de chantier</SelectItem>
                      <SelectItem value="Ouvrier">Ouvrier</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Assistant">Assistant</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-foreground">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-foreground">Téléphone</Label>
                  <Input
                    id="edit-phone"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-login_code" className="text-foreground">Code de connexion</Label>
                  <Input
                    id="edit-login_code"
                    value={editingMember.login_code}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, login_code: e.target.value } : null)}
                    className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground font-mono"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-foreground">Statut</Label>
                  <Select 
                    value={editingMember.status} 
                    onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, status: value as 'actif' | 'inactif' } : null)}
                  >
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#080d1a]/30 backdrop-blur-lg border border-border text-foreground">
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-foreground border-gray-300 dark:border-white/20 hover:bg-white/5">
                Annuler
              </Button>
              <Button onClick={handleUpdateMember}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="surface-card backdrop-blur-sm text-foreground rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Lien d'invitation créé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-subtitle text-sm">
              Partagez ce lien avec le membre d'équipe pour qu'il puisse se connecter :
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteLink || ''}
                readOnly
                className="bg-gray-50 dark:bg-[#080d1a]/20 border-border text-foreground font-mono text-sm"
              />
              <Button
                onClick={() => {
                  if (inviteLink) {
                    navigator.clipboard.writeText(inviteLink);
                    alert('Lien copié dans le presse-papier !');
                  }
                }}
                className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-foreground border border-border hover:bg-gray-200 dark:hover:bg-white/30"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-secondary">
              Le membre devra entrer son code de connexion sur la page d'invitation.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInviteModal(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
