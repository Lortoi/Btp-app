import { useState, useEffect, useRef } from 'react';
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
  X,
  Sparkles,
} from 'lucide-react';
import AccountDialog from './AccountDialog';

const AI_TOOLS = [
  { icon: Upload,     label: 'Import factures',       path: '/dashboard/import' },
  { icon: Calculator, label: 'Estimation automatique', path: '/dashboard/estimation' },
  { icon: Wand2,      label: 'Visualisation IA',       path: '/dashboard/ai-visualization' },
] as const;

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  const isMobileOpen = useMobileNavStore((s) => s.isOpen);
  const closeMobile = useMobileNavStore((s) => s.close);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aiMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node)) {
        setAiMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aiMenuOpen]);

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
    { icon: Home,       label: "Vue d'ensemble",      path: '/dashboard',                    active: location === '/dashboard' },
    { icon: Upload,     label: 'Import factures',      path: '/dashboard/import',             active: location === '/dashboard/import' },
    { icon: Calculator, label: 'Estimation automatique', path: '/dashboard/estimation',       active: location === '/dashboard/estimation' },
    { icon: Building,   label: 'Mes Chantiers',        path: '/dashboard/projects',           active: location === '/dashboard/projects' },
    { icon: Calendar,   label: 'Planning',             path: '/dashboard/planning',           active: location === '/dashboard/planning' },
    { icon: Workflow,   label: 'CRM Pipeline',         path: '/dashboard/crm',               active: location === '/dashboard/crm' },
    { icon: FileText,   label: 'Générateur de Devis',  path: '/dashboard/quotes',            active: location === '/dashboard/quotes' },
    { icon: Wand2,      label: 'Visualisation IA',     path: '/dashboard/ai-visualization',  active: location === '/dashboard/ai-visualization' },
    { icon: Users,      label: 'Équipe',               path: '/dashboard/team',              active: location === '/dashboard/team' },
    { icon: User,       label: 'Clients',              path: '/dashboard/clients',           active: location === '/dashboard/clients' },
  ];

  const quickActions = [
    { icon: FileText, label: 'Nouveau Devis',    path: '/dashboard/quotes' as const },
    { icon: Wand2,    label: 'Visualiser Projet', path: '/dashboard/ai-visualization' as const },
    { icon: Building, label: 'Ajouter Chantier', path: '/dashboard/projects?openDialog=true' as const },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          aria-hidden
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-[#080808] backdrop-blur-sm border-r border-white/[0.08] transition-all duration-300 ease-in-out flex flex-col z-50",
          collapsed ? "w-16" : "w-72 max-w-[85vw]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between gap-2">
          {/* Bloc compte utilisateur */}
          <button
            type="button"
            onClick={() => setLocation('/dashboard/settings')}
            className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          >
            <div className="h-9 w-9 rounded-full bg-[#e8702a]/20 border border-[#e8702a]/30 flex items-center justify-center shrink-0">
              <span className="text-[#e8702a] text-sm font-bold">D</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">Dupont Rénovation</p>
                <p className="text-xs text-white/40">Pro</p>
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Fermer le menu"
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!collapsed && (
            <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-4 px-2">
              Navigation
            </div>
          )}

          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 rounded-xl",
                  collapsed && "justify-center",
                  item.active
                    ? (item.path === '/dashboard/ai-visualization' ? "ai-nav-active text-white" : "nav-active text-white")
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
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
              <div className="text-xs font-medium text-white/40 uppercase tracking-wide mt-8 mb-4 px-2">
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
                )
              })}

              {/* Outils avancés */}
              <div className="text-xs font-medium text-white/30 uppercase tracking-wide mt-8 mb-3 px-2">
                Outils avancés
              </div>
              {AI_TOOLS.map((tool) => (
                <Link key={tool.path} href={tool.path}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-9 rounded-xl",
                      location === tool.path
                        ? "text-white/60 bg-white/5"
                        : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
                    )}
                  >
                    <tool.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs">{tool.label}</span>
                  </Button>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/[0.08] mt-auto space-y-1">
          {/* Bouton outils IA */}
          <div ref={aiMenuRef} className="relative mb-2">
            <button
              type="button"
              onClick={() => setAiMenuOpen((v) => !v)}
              title="Outils IA"
              className={cn(
                "flex items-center gap-2.5 w-full rounded-xl px-2 py-2 transition-colors",
                "bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20",
                collapsed && "justify-center"
              )}
            >
              <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
              {!collapsed && <span className="text-violet-300 text-sm">Outils IA</span>}
            </button>

            {aiMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-52 rounded-2xl border border-white/10 bg-[#111111] shadow-xl overflow-hidden z-50">
                {AI_TOOLS.map((tool) => (
                  <button
                    key={tool.path}
                    type="button"
                    onClick={() => {
                      setLocation(tool.path);
                      setAiMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left border-b border-white/[0.05] last:border-b-0"
                  >
                    <tool.icon className="h-4 w-4 text-violet-400 shrink-0" />
                    {tool.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/dashboard/settings">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 rounded-xl",
                collapsed && "justify-center",
                location === "/dashboard/settings"
                  ? "nav-active text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5",
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
                "w-full justify-start gap-3 h-10 rounded-xl text-white/50",
                collapsed && "justify-center",
                "hover:text-white/80 hover:bg-white/5"
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
