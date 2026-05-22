import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobileNavStore } from '@/stores/mobileNavStore';
import { 
  Hammer, 
  Home, 
  FileText, 
  Wand2, 
  User,
  Users,
  Settings, 
  Bell,
  Upload,
  Calendar,
  Building,
  Calculator,
  Workflow,
  UserCircle,
  X
} from 'lucide-react';
import AccountDialog from './AccountDialog';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  // Responsive: drawer mobile contrôlé par le store global.
  // Sur lg+ (≥1024 px), la sidebar reste visible en permanence — isOpen est ignoré par les classes `lg:translate-x-0`.
  const isMobileOpen = useMobileNavStore((s) => s.isOpen);
  const closeMobile = useMobileNavStore((s) => s.close);

  // Auto-close du drawer à chaque changement de route.
  useEffect(() => {
    closeMobile();
  }, [location, closeMobile]);

  // ESC ferme le drawer sur mobile.
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileOpen, closeMobile]);

  const menuItems = [
    { icon: Home, label: 'Vue d\'ensemble', path: '/dashboard', active: location === '/dashboard' },
    { icon: Upload, label: 'Import factures', path: '/dashboard/import', active: location === '/dashboard/import' },
    { icon: Calculator, label: 'Estimation automatique', path: '/dashboard/estimation', active: location === '/dashboard/estimation' },
    { icon: Building, label: 'Mes Chantiers', path: '/dashboard/projects', active: location === '/dashboard/projects' },
    { icon: Calendar, label: 'Planning', path: '/dashboard/planning', active: location === '/dashboard/planning' },
    { icon: Workflow, label: 'CRM Pipeline', path: '/dashboard/crm', active: location === '/dashboard/crm' },
    { icon: FileText, label: 'Générateur de Devis', path: '/dashboard/quotes', active: location === '/dashboard/quotes' },
    { icon: Wand2, label: 'Visualisation IA', path: '/dashboard/ai-visualization', active: location === '/dashboard/ai-visualization' },
    { icon: Users, label: 'Équipe', path: '/dashboard/team', active: location === '/dashboard/team' },
    { icon: User, label: 'Clients', path: '/dashboard/clients', active: location === '/dashboard/clients' },
  ];

  const quickActions = [
    { icon: FileText, label: 'Nouveau Devis', path: '/dashboard/quotes' as const },
    { icon: Wand2, label: 'Visualiser Projet', path: '/dashboard/ai-visualization' as const },
    { icon: Building, label: 'Ajouter Chantier', path: '/dashboard/projects?openDialog=true' as const },
  ];

  return (
    <>
      {/* Overlay (mobile uniquement) — caché sur lg+ */}
      {isMobileOpen && (
        <div
          aria-hidden
          onClick={closeMobile}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-white/90 dark:bg-black/20 backdrop-blur-xl border-r border-border dark:border-white/10 transition-all duration-300 ease-in-out flex flex-col z-50 rounded-r-3xl",
          collapsed ? "w-16" : "w-64 max-w-[80vw]",
          // Drawer mobile : caché par défaut sous lg, visible quand isMobileOpen.
          // Sur lg+ : toujours visible (translate-x-0).
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-white/10 flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground dark:text-white">PLANCHAIS</span>
          <span className="text-xs text-muted-foreground dark:text-white/70 italic">Construire pour durer</span>
        </div>
        {/* Bouton de fermeture du drawer (mobile uniquement) */}
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Fermer le menu"
          className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {!collapsed && (
          <div className="text-xs font-medium text-white/60 uppercase tracking-wide mb-4">
            Navigation
          </div>
        )}
        
        {menuItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 text-white",
                collapsed && "justify-center",
                item.active && "bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/30",
                !item.active && "hover:bg-white/10"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}

        {!collapsed && (
          <>
            <div className="text-xs font-medium text-white/60 uppercase tracking-wide mt-8 mb-4">
              Actions Rapides
            </div>
            
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-3 h-9 text-white border-white/20 hover:bg-white/10"
                onClick={() => setLocation(action.path)}
                data-testid={`quick-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </Button>
            ))}
          </>
        )}
      </nav>

      {/* Account Button at the bottom */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <AccountDialog>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-10 text-white",
              collapsed && "justify-center",
              "hover:bg-white/10"
            )}
          >
            <UserCircle className="h-4 w-4" />
            {!collapsed && <span>Compte</span>}
          </Button>
        </AccountDialog>
      </div>
      </div>
    </>
  );
}