import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
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
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import AccountDialog from './AccountDialog';

const AI_TOOLS = [
  { icon: Upload, label: 'Import factures', path: '/dashboard/import', iconColor: '#7c3aed' },
  { icon: Calculator, label: 'Estimation automatique', path: '/dashboard/estimation', iconColor: '#7c3aed' },
  { icon: Wand2, label: 'Visualisation IA', path: '/dashboard/ai-visualization', iconColor: '#7c3aed' },
] as const;

const NAV_ICON_COLORS: Record<string, string> = {
  '/dashboard': '#e8702a',
  '/dashboard/projects': '#e8702a',
  '/dashboard/planning': '#3b82f6',
  '/dashboard/crm': '#3b82f6',
  '/dashboard/quotes': '#e8702a',
  '/dashboard/team': '#22c55e',
  '/dashboard/clients': '#22c55e',
  '/dashboard/ai-visualization': '#7c3aed',
  '/dashboard/import': '#7c3aed',
  '/dashboard/estimation': '#7c3aed',
};

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  active: boolean;
  iconColor: string;
  compact?: boolean;
  onNavigate?: () => void;
}

function NavItem({ icon: Icon, label, path, active, iconColor, compact, onNavigate }: NavItemProps) {
  return (
    <Link href={path} onClick={onNavigate}>
      <span
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-lg transition-colors',
          compact ? 'py-2 px-3 text-sm' : 'h-10 gap-3 rounded-xl px-2',
          active ? 'bg-white/8' : 'hover:bg-white/5',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" style={{ color: iconColor }} />
        <span className={cn('truncate', compact ? 'text-sm' : 'text-sm', active ? 'text-white' : 'text-white/60')}>
          {label}
        </span>
      </span>
    </Link>
  );
}

interface SidebarContentProps {
  compact?: boolean;
  expanded?: boolean;
  onNavigate?: () => void;
}

function AccountBlock({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn('border-b border-white/8 mb-2', expanded ? 'p-4' : 'flex justify-center p-2')}>
      <div className={cn('flex items-center', expanded && 'gap-3')}>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #e8702a, #7c3aed)' }}
        >
          D
        </div>
        {expanded && (
          <div className="sidebar-text min-w-0">
            <p className="truncate text-sm font-semibold text-white">Dupont Rénovation</p>
            <p className="text-xs text-white/40">Pro</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children, compact, muted }: { children: React.ReactNode; compact?: boolean; muted?: boolean }) {
  return (
    <p
      className={cn(
        'font-medium uppercase tracking-wide',
        muted ? 'text-white/30' : 'text-white/40',
        compact ? 'mb-1 mt-3 px-3 text-[10px]' : 'mb-3 mt-6 px-2 text-xs',
      )}
    >
      {children}
    </p>
  );
}

function SidebarContent({ compact, expanded = true, onNavigate }: SidebarContentProps) {
  const [location, setLocation] = useLocation();
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

  const menuItems = [
    { icon: Home, label: "Vue d'ensemble", path: '/dashboard' },
    { icon: Building, label: 'Mes Chantiers', path: '/dashboard/projects' },
    { icon: Calendar, label: 'Planning', path: '/dashboard/planning' },
    { icon: Workflow, label: 'CRM Pipeline', path: '/dashboard/crm' },
    { icon: FileText, label: 'Générateur de Devis', path: '/dashboard/quotes' },
    { icon: Wand2, label: 'Visualisation IA', path: '/dashboard/ai-visualization' },
    { icon: Users, label: 'Équipe', path: '/dashboard/team' },
    { icon: User, label: 'Clients', path: '/dashboard/clients' },
    { icon: Upload, label: 'Import factures', path: '/dashboard/import' },
    { icon: Calculator, label: 'Estimation automatique', path: '/dashboard/estimation' },
  ];

  const quickActions = [
    { icon: FileText, label: 'Nouveau Devis', path: '/dashboard/quotes', iconColor: '#e8702a' },
    { icon: Building, label: 'Ajouter Chantier', path: '/dashboard/projects?openDialog=true', iconColor: '#e8702a' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location === '/dashboard';
    return location === path || location.startsWith(`${path}?`);
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
    onNavigate?.();
  };

  return (
    <>
      <AccountBlock expanded={expanded} />

      <nav className={cn('flex-1 overflow-y-auto', compact ? 'space-y-0.5 p-1' : 'space-y-1 p-2')}>
        <SectionLabel compact={compact}>Navigation</SectionLabel>

        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={isActive(item.path)}
            iconColor={NAV_ICON_COLORS[item.path] ?? '#e8702a'}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}

        <SectionLabel compact={compact}>Actions Rapides</SectionLabel>
        {quickActions.map((action) => (
          <button
            key={action.path}
            type="button"
            onClick={() => handleNavigate(action.path)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-white/5',
              compact ? 'py-2 px-3 text-sm' : 'h-9 gap-3 rounded-xl px-2',
            )}
          >
            <action.icon className="h-4 w-4 shrink-0" style={{ color: action.iconColor }} />
            <span className="truncate text-sm text-white/60">{action.label}</span>
          </button>
        ))}

        <SectionLabel compact={compact} muted>
          Outils avancés
        </SectionLabel>
        {AI_TOOLS.map((tool) => (
          <NavItem
            key={tool.path}
            icon={tool.icon}
            label={tool.label}
            path={tool.path}
            active={isActive(tool.path)}
            iconColor={tool.iconColor}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className={cn('mt-auto border-t border-white/[0.08]', compact ? 'space-y-0.5 p-1' : 'space-y-1 p-2')}>
        <div ref={aiMenuRef} className="relative mb-1">
          <button
            type="button"
            onClick={() => setAiMenuOpen((v) => !v)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border border-violet-500/20 bg-violet-600/10 transition-colors hover:bg-violet-600/20',
              compact ? 'py-2 px-3 text-sm' : 'rounded-xl px-2 py-2',
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-[#7c3aed]" />
            <span className="text-sm text-[#7c3aed]">Outils IA</span>
          </button>

          {aiMenuOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0e1e36] shadow-xl">
              {AI_TOOLS.map((tool) => (
                <button
                  key={tool.path}
                  type="button"
                  onClick={() => {
                    handleNavigate(tool.path);
                    setAiMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 border-b border-white/[0.05] px-4 py-3 text-left text-sm text-white/70 transition-colors last:border-b-0 hover:bg-white/5 hover:text-white"
                >
                  <tool.icon className="h-4 w-4 shrink-0" style={{ color: tool.iconColor }} />
                  {tool.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Link href="/dashboard/settings" onClick={onNavigate}>
          <span
            className={cn(
              'flex w-full cursor-pointer items-center gap-2.5 rounded-lg transition-colors',
              compact ? 'py-2 px-3 text-sm' : 'h-10 gap-3 rounded-xl px-2',
              isActive('/dashboard/settings') ? 'bg-white/8' : 'hover:bg-white/5',
            )}
          >
            <Settings className="h-4 w-4 shrink-0 text-white/40" />
            <span className={cn('text-sm', isActive('/dashboard/settings') ? 'text-white' : 'text-white/60')}>
              Paramètres
            </span>
          </span>
        </Link>

        <AccountDialog>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg transition-colors hover:bg-white/5',
              compact ? 'py-2 px-3 text-sm' : 'h-10 gap-3 rounded-xl px-2',
            )}
          >
            <UserCircle className="h-4 w-4 shrink-0 text-white/40" />
            <span className="text-sm text-white/60">Compte</span>
          </button>
        </AccountDialog>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const isOpen = useMobileNavStore((s) => s.isOpen);
  const close = useMobileNavStore((s) => s.close);

  useEffect(() => {
    close();
  }, [location, close]);

  return (
    <>
      {isOpen && (
        <div
          aria-hidden
          onClick={close}
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-300"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/8 bg-[#060e1f] transition-all duration-300 ease-in-out',
          isOpen ? 'w-64' : 'w-0 overflow-hidden',
        )}
      >
        <SidebarContent expanded={isOpen} onNavigate={close} />
      </aside>
    </>
  );
}
