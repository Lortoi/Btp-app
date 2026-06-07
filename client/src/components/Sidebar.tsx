import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobileNavStore } from '@/stores/mobileNavStore';
import { 
  Home, 
  FileText, 
  Wand2, 
  User,
  Users,
  Settings, 
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
  const isMobileOpen = useMobileNavStore((s) => s.isOpen);
  const closeMobile = useMobileNavStore((s) => s.close);

  useEffect(() => {
    closeMobile();
  }, [location, closeMobile]);

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
      {isMobileOpen && (
        <div
          aria-hidden
          onClick={closeMobile}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-[#0A0A0A]/95 backdrop-blur-sm border-r border-[#222222] transition-all duration-300 ease-in-out flex flex-col z-50",
          collapsed ? "w-16" : "w-64 max-w-[80vw]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
      <div className="p-4 border-b border-[#222222] flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white">PLANCHAIS</span>
          <span className="text-xs text-gray-400 italic">Construire pour durer</span>
        </div>
        <button
          type="button"
          onClick={closeMobile}
          aria-label="Fermer le menu"
          className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mb-4 px-2">
            Navigation
          </div>
        )}
        
        {menuItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 text-gray-400",
                collapsed && "justify-center",
                item.active && (item.path === '/dashboard/ai-visualization' ? "ai-nav-active text-white" : "nav-active text-white"),
                !item.active && "hover:text-white hover:bg-white/5"
              )}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className={cn("h-4 w-4", item.active && (item.path === '/dashboard/ai-visualization' ? "text-ai-light" : "text-brand"))} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}

        {!collapsed && (
          <>
            <div className="text-xs font-medium text-[#888888] uppercase tracking-wide mt-8 mb-4 px-2">
              Actions Rapides
            </div>
            
            {quickActions.map((action, index) => {
              const isAi = action.path.includes("ai-visualization")
              return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className={cn("w-full justify-start gap-3 h-9", isAi && "border-ai/30 hover:border-ai/50")}
                onClick={() => setLocation(action.path)}
                data-testid={`quick-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <action.icon className={cn("h-4 w-4", isAi ? "text-ai-light" : "text-brand")} />
                <span>{action.label}</span>
              </Button>
            )})}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-[#222222] mt-auto space-y-1">
        <Link href="/dashboard/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-10",
              collapsed && "justify-center",
              location === "/dashboard/settings"
                ? "nav-active text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Paramètres</span>}
          </Button>
        </Link>
        <AccountDialog>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-10 text-gray-400",
              collapsed && "justify-center",
              "hover:text-white hover:bg-white/5"
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
