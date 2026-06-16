import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useMobileNavStore } from '@/stores/mobileNavStore';
import {
  Home,
  FileText,
  Wand2,
  User,
  Users,
  Upload,
  Calendar,
  Building,
  Calculator,
  Workflow,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

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
  hoverId: string;
  hoveredItem: string | null;
  setHoveredItem: (id: string | null) => void;
  compact?: boolean;
  onNavigate?: () => void;
}

function getNavItemHoverStyle(
  hoverId: string,
  hoveredItem: string | null,
  active: boolean,
): React.CSSProperties {
  if (active) {
    return { cursor: 'pointer' };
  }

  const isHovered = hoveredItem === hoverId;
  return {
    background: isHovered
      ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))'
      : 'transparent',
    borderLeft: isHovered ? '2px solid #7c3aed' : '2px solid transparent',
    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '8px',
    cursor: 'pointer',
  };
}

function NavItem({
  icon: Icon,
  label,
  path,
  active,
  iconColor,
  hoverId,
  hoveredItem,
  setHoveredItem,
  compact,
  onNavigate,
}: NavItemProps) {
  return (
    <Link href={path} onClick={onNavigate}>
      <span
        className={cn(
          'nav-item flex w-full cursor-pointer items-center gap-2.5 rounded-lg transition-colors',
          compact ? 'py-2 px-3 text-sm' : 'h-10 gap-3 rounded-xl px-2',
          active && 'bg-white/8',
        )}
        onMouseEnter={() => !active && setHoveredItem(hoverId)}
        onMouseLeave={() => !active && setHoveredItem(null)}
        style={getNavItemHoverStyle(hoverId, hoveredItem, active)}
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
      <Link
        href="/dashboard/compte"
        className={cn(
          'flex items-center cursor-pointer rounded-[10px] p-2 transition-colors hover:bg-white/5',
          expanded && 'gap-3 w-full',
        )}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #e8702a, #7c3aed)' }}
        >
          D
        </div>
        {expanded && (
          <>
            <div className="sidebar-text min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Dupont Rénovation</p>
              <p className="text-xs text-white/40">Pro</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-40" aria-hidden />
          </>
        )}
      </Link>
    </div>
  );
}

function SectionLabel({ children, compact, muted }: { children: React.ReactNode; compact?: boolean; muted?: boolean }) {
  return (
    <p
      className={cn(
        'section-label font-medium uppercase tracking-wide',
        muted ? 'text-white/30' : 'text-white/40',
        compact ? 'mb-1 mt-3 px-3 text-[10px]' : 'mb-3 mt-6 px-2 text-xs',
      )}
    >
      {children}
    </p>
  );
}

function SidebarContent({ compact, expanded = true, onNavigate }: SidebarContentProps) {
  const [location] = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    { icon: Home, label: "Vue d'ensemble", path: '/dashboard', hoverId: 'vue_ensemble' },
    { icon: Building, label: 'Mes Chantiers', path: '/dashboard/projects', hoverId: 'mes_chantiers' },
    { icon: Calendar, label: 'Planning', path: '/dashboard/planning', hoverId: 'planning' },
    { icon: Workflow, label: 'CRM Pipeline', path: '/dashboard/crm', hoverId: 'crm_pipeline' },
    { icon: FileText, label: 'Générateur de Devis', path: '/dashboard/quotes', hoverId: 'generateur_devis' },
    { icon: Wand2, label: 'Visualisation IA', path: '/dashboard/ai-visualization', hoverId: 'visualisation_ia' },
    { icon: Users, label: 'Équipe', path: '/dashboard/team', hoverId: 'equipe' },
    { icon: User, label: 'Clients', path: '/dashboard/clients', hoverId: 'clients' },
    { icon: Upload, label: 'Import factures', path: '/dashboard/import', hoverId: 'import_factures' },
    { icon: Calculator, label: 'Estimation automatique', path: '/dashboard/estimation', hoverId: 'estimation_automatique' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location === '/dashboard';
    return location === path || location.startsWith(`${path}?`);
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
            hoverId={item.hoverId}
            hoveredItem={hoveredItem}
            setHoveredItem={setHoveredItem}
            compact={compact}
            onNavigate={onNavigate}
          />
        ))}

      </nav>
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
          'sidebar fixed left-0 top-0 z-50 flex h-full flex-col overflow-y-auto border-r border-white/8 bg-[#060e1f] transition-all duration-300 ease-in-out',
          isOpen ? 'w-64' : 'w-0 overflow-hidden',
        )}
      >
        <SidebarContent expanded={isOpen} onNavigate={close} />
      </aside>
    </>
  );
}
