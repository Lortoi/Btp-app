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
  Building,
  Key,
  Edit2,
  HardHat,
  Check,
  Copy,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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
    nom: 'Thomas Renard',
    role: 'Chef de Chantier',
    telephone: '06 11 22 33 44',
    chantiers: ['Rénovation Dupont', 'Extension Martin'],
    statut: 'Disponible',
    couleurAvatar: '#F97316',
  },
  {
    id: 'mock-2',
    nom: 'Karim Benali',
    role: 'Maçon',
    telephone: '06 55 66 77 88',
    chantiers: ['Maçonnerie Résidence Les Pins'],
    statut: 'En chantier',
    couleurAvatar: '#3B82F6',
  },
  {
    id: 'mock-3',
    nom: 'Sébastien Morel',
    role: 'Électricien',
    telephone: '06 33 44 55 66',
    chantiers: ['Plomberie Immeuble Voltaire'],
    statut: 'En chantier',
    couleurAvatar: '#10B981',
  },
  {
    id: 'mock-4',
    nom: 'Lucas Petit',
    role: 'Peintre',
    telephone: '06 77 88 99 00',
    chantiers: [],
    statut: 'Disponible',
    couleurAvatar: '#8B5CF6',
  },
];

function initialsFromNom(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return nom.slice(0, 2).toUpperCase();
}

function statutBadgeClass(statut: MembreStatut): string {
  switch (statut) {
    case 'Disponible':
      return 'bg-[#10B981]/20 text-emerald-100 border-[#10B981]/30';
    case 'En chantier':
      return 'bg-[#F97316]/20 text-orange-100 border-[#F97316]/30';
    case 'Absent':
      return 'bg-[#EF4444]/20 text-red-100 border-[#EF4444]/30';
    default:
      return 'bg-white/10 text-white/80';
  }
}

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
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Gestion de l'Équipe
            </h1>
            <p className="text-sm text-white/70">Gérez les membres de votre équipe et leurs codes de connexion</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un Membre
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/20 backdrop-blur-xl border border-white/10 text-white rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Ajouter un Nouveau Membre</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nom complet</Label>
                  <Input
                    id="name"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white"
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white">Rôle</Label>
                  <Select value={newMember.role} onValueChange={(value) => setNewMember(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/30 backdrop-blur-lg border-white/10 text-white">
                      <SelectItem value="Chef de chantier">Chef de chantier</SelectItem>
                      <SelectItem value="Ouvrier">Ouvrier</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Assistant">Assistant</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white"
                    placeholder="jean.dupont@planchais.fr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white"
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login_code" className="text-white">Code de connexion *</Label>
                  <Input
                    id="login_code"
                    value={newMember.login_code}
                    onChange={(e) => setNewMember(prev => ({ ...prev, login_code: e.target.value }))}
                    className="bg-black/20 border-white/10 text-white font-mono"
                    placeholder="Entrez le code de connexion"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-white border-white/20 hover:bg-white/10">
                  Annuler
                </Button>
                <Button onClick={handleAddMember}>Ajouter le Membre</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membres</CardTitle>
              <Users className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiStats.total} membres</div>
              <p className="text-xs text-white/70">Équipe (démo)</p>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En chantier</CardTitle>
              <HardHat className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiStats.enChantier} en chantier</div>
              <p className="text-xs text-white/70">sur le terrain</p>
            </CardContent>
          </Card>
          <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Check className="h-4 w-4 text-white/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiStats.disponibles} disponibles</div>
              <p className="text-xs text-white/70">prêts à affecter</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-white/70" />
              Membres de l'Équipe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockEquipe.map((m) => (
                <Card
                  key={m.id}
                  className="relative bg-black/20 backdrop-blur-md border border-white/10 text-white overflow-hidden flex flex-col"
                >
                  <Badge
                    className={`absolute top-3 right-3 border ${statutBadgeClass(m.statut)}`}
                    variant="outline"
                  >
                    {m.statut}
                  </Badge>
                  <CardHeader className="pb-2 pr-24">
                    <div className="flex items-start gap-4">
                      <div
                        className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner"
                        style={{ backgroundColor: m.couleurAvatar }}
                      >
                        {initialsFromNom(m.nom)}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-bold text-white leading-tight">{m.nom}</p>
                        <p className="text-sm text-white/60 mt-1">{m.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      <Phone className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
                      <span>{m.telephone}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">
                        Chantiers assignés
                      </p>
                      {m.chantiers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {m.chantiers.map((c) => (
                            <span
                              key={c}
                              className="inline-block text-xs px-2 py-1 rounded-md bg-white/10 text-white border border-white/10"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-white/50 italic">Aucun chantier assigné</p>
                      )}
                    </div>
                    <div className="pt-2 mt-auto">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-white border-white/20 hover:bg-white/10"
                      >
                        Voir le profil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!loading && members.length > 0 && (
              <div className="border-t border-white/10 pt-6 space-y-2">
                <p className="text-sm font-medium text-white/80">Membres enregistrés</p>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg hover:bg-black/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                          <User className="h-6 w-6 text-white/70" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-white/70">{member.role}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-xs text-white/60">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-1 text-xs text-white/60">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-white/60">
                              <Key className="h-3 w-3" />
                              <span className="font-mono">{member.login_code}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={member.status === 'actif' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}>
                          {member.status === 'actif' ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                          className="text-white/70 hover:bg-white/10 hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-white/70 hover:bg-white/10 hover:text-white"
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
          <DialogContent className="bg-black/20 backdrop-blur-xl border border-white/10 text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Modifier le Membre</DialogTitle>
            </DialogHeader>
            {editingMember && (
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-white">Nom complet</Label>
                  <Input
                    id="edit-name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-white">Rôle</Label>
                  <Select 
                    value={editingMember.role} 
                    onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, role: value } : null)}
                  >
                    <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/30 backdrop-blur-lg border-white/10 text-white">
                      <SelectItem value="Chef de chantier">Chef de chantier</SelectItem>
                      <SelectItem value="Ouvrier">Ouvrier</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Assistant">Assistant</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-white">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone" className="text-white">Téléphone</Label>
                  <Input
                    id="edit-phone"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-login_code" className="text-white">Code de connexion</Label>
                  <Input
                    id="edit-login_code"
                    value={editingMember.login_code}
                    onChange={(e) => setEditingMember(prev => prev ? { ...prev, login_code: e.target.value } : null)}
                    className="bg-black/20 border-white/10 text-white font-mono"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-white">Statut</Label>
                  <Select 
                    value={editingMember.status} 
                    onValueChange={(value) => setEditingMember(prev => prev ? { ...prev, status: value as 'actif' | 'inactif' } : null)}
                  >
                    <SelectTrigger className="w-full bg-black/20 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/30 backdrop-blur-lg border-white/10 text-white">
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-white border-white/20 hover:bg-white/10">
                Annuler
              </Button>
              <Button onClick={handleUpdateMember}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-white/70" />
              Affectation aux Chantiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/70">
              Affectez les membres de l'équipe aux chantiers depuis la fiche chantier ou depuis le planning.
              Cette fonctionnalité vous permet de suivre qui travaille sur quel projet.
            </p>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-black/20 backdrop-blur-xl border border-white/10 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Lien d'invitation créé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/70 text-sm">
              Partagez ce lien avec le membre d'équipe pour qu'il puisse se connecter :
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteLink || ''}
                readOnly
                className="bg-black/20 border-white/10 text-white font-mono text-sm"
              />
              <Button
                onClick={() => {
                  if (inviteLink) {
                    navigator.clipboard.writeText(inviteLink);
                    alert('Lien copié dans le presse-papier !');
                  }
                }}
                className="bg-white/20 backdrop-blur-md text-white border border-white/10 hover:bg-white/30"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-white/50">
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
