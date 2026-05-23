import { useState, useEffect, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, User as UserIcon, Briefcase, Phone } from 'lucide-react';
import type { TeamMember } from '@/lib/supabase';

interface AccountDialogProps {
  children: ReactNode;
}

export default function AccountDialog({ children }: AccountDialogProps) {
  const { user } = useAuth();
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [userType, setUserType] = useState<'admin' | 'team' | null>(null);

  useEffect(() => {
    // Récupérer le type d'utilisateur et les informations
    const storedUserType = localStorage.getItem('userType');
    setUserType(storedUserType as 'admin' | 'team' | null);

    // Si c'est un membre d'équipe, récupérer ses informations
    if (storedUserType === 'team') {
      const storedMember = localStorage.getItem('teamMember');
      if (storedMember) {
        try {
          setTeamMember(JSON.parse(storedMember));
        } catch (error) {
          console.error('Error parsing team member data:', error);
        }
      }
    }
  }, []);

  // Fonction pour obtenir les initiales du nom
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Déterminer le nom à afficher
  const displayName = userType === 'team' && teamMember 
    ? teamMember.name 
    : user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur';

  // Déterminer l'email à afficher
  const displayEmail = userType === 'team' && teamMember 
    ? teamMember.email 
    : user?.email || 'Non disponible';

  // Déterminer le rôle
  const displayRole = userType === 'team' && teamMember 
    ? teamMember.role 
    : 'Administrateur';

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white text-2xl">Mon Compte</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar et nom */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20 border-2 border-gray-300 dark:border-white/20">
              <AvatarFallback className="bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white text-xl">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{displayName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{displayRole}</p>
            </div>
          </div>

          <Separator className="bg-gray-100 dark:bg-white/10" />

          {/* Informations du compte */}
          <div className="space-y-4">
            <Card className="bg-gray-50 dark:bg-white/5 border-gray-300 dark:border-gray-600">
              <CardContent className="pt-6 space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <Label className="text-gray-600 dark:text-gray-300 text-sm">Email</Label>
                  </div>
                  <p className="text-gray-900 dark:text-white ml-6">{displayEmail}</p>
                </div>

                {/* Nom complet (si membre d'équipe) */}
                {userType === 'team' && teamMember && (
                  <>
                    <Separator className="bg-gray-100 dark:bg-white/10" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <Label className="text-gray-600 dark:text-gray-300 text-sm">Nom complet</Label>
                      </div>
                      <p className="text-gray-900 dark:text-white ml-6">{teamMember.name}</p>
                    </div>
                  </>
                )}

                {/* Rôle */}
                <Separator className="bg-gray-100 dark:bg-white/10" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <Label className="text-gray-600 dark:text-gray-300 text-sm">Rôle</Label>
                  </div>
                  <p className="text-gray-900 dark:text-white ml-6">{displayRole}</p>
                </div>

                {/* Téléphone (si membre d'équipe) */}
                {userType === 'team' && teamMember && teamMember.phone && (
                  <>
                    <Separator className="bg-gray-100 dark:bg-white/10" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <Label className="text-gray-600 dark:text-gray-300 text-sm">Téléphone</Label>
                      </div>
                      <p className="text-gray-900 dark:text-white ml-6">{teamMember.phone}</p>
                    </div>
                  </>
                )}

                {/* Code de connexion (si membre d'équipe) */}
                {userType === 'team' && teamMember && (
                  <>
                    <Separator className="bg-gray-100 dark:bg-white/10" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <Label className="text-gray-600 dark:text-gray-300 text-sm">Code de connexion</Label>
                      </div>
                      <p className="text-white ml-6 font-mono">{teamMember.login_code}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
