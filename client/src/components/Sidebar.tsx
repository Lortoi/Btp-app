import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useMobileNavStore } from '@/stores/mobileNavStore';
import { useAuth } from '@/context/AuthContext';
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
  HelpCircle,
  LogOut,
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
  '/dashboard/settings': '#94a3b8',
  '/dashboard/compte': '#94a3b8',
};

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  hoverId: string;
}

interface IconNavItemProps {
  item: MenuItem;
  active: boolean;
  setTooltip: (tooltip: { label: string; y: number } | null) => void;
  onNavigate?: () => void;
}

function NavSeparator() {
  return (
    <div
      style={{
        width: '32px',
        height: '1px',
        background: 'rgba(255,255,255,0.08)',
        margin: '8px auto',
      }}
    />
  );
}

function IconNavItem({
  item,
  active,
  setTooltip,
  onNavigate,
}: IconNavItemProps) {
  const { icon: Icon, label, path } = item;
  const [isHovered, setIsHovered] = useState(false);
  const iconColor = NAV_ICON_COLORS[path] ?? '#e8702a';

  return (
    <Link href={path} onClick={onNavigate}>
      <div
        className="relative"
        onMouseEnter={(e) => {
          setIsHovered(true);
          setTooltip({
            label,
            y: e.currentTarget.getBoundingClientRect().top + 12,
          });
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setTooltip(null);
        }}
      >
        <div
          className="nav-item"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '2px auto',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: active
              ? 'rgba(124,58,237,0.2)'
              : isHovered
                ? 'rgba(255,255,255,0.08)'
                : 'transparent',
            border: active ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
          }}
        >
          <Icon className="h-5 w-5 shrink-0" style={{ color: iconColor }} />
        </div>
      </div>
    </Link>
  );
}

function AccountBlock() {
  return (
    <Link href="/dashboard/compte">
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e8702a, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: 'white',
          margin: '16px auto',
        }}
      >
        DR
      </div>
    </Link>
  );
}

interface SidebarContentProps {
  onNavigate?: () => void;
  setTooltip: (tooltip: { label: string; y: number } | null) => void;
  onHelpClick: () => void;
  onLogoutClick: () => void;
}

function SidebarContent({ onNavigate, setTooltip, onHelpClick, onLogoutClick }: SidebarContentProps) {
  const [location] = useLocation();
  const [helpHovered, setHelpHovered] = useState(false);
  const [logoutHovered, setLogoutHovered] = useState(false);

  const navGroups: MenuItem[][] = [
    [
      { icon: Home, label: "Vue d'ensemble", path: '/dashboard', hoverId: 'vue_ensemble' },
      { icon: Building, label: 'Mes Chantiers', path: '/dashboard/projects', hoverId: 'mes_chantiers' },
      { icon: Calendar, label: 'Planning', path: '/dashboard/planning', hoverId: 'planning' },
      { icon: Workflow, label: 'CRM Pipeline', path: '/dashboard/crm', hoverId: 'crm_pipeline' },
      { icon: FileText, label: 'Générateur de Devis', path: '/dashboard/quotes', hoverId: 'generateur_devis' },
    ],
    [
      { icon: Wand2, label: 'Visualisation IA', path: '/dashboard/ai-visualization', hoverId: 'visualisation_ia' },
      { icon: Users, label: 'Équipe', path: '/dashboard/team', hoverId: 'equipe' },
      { icon: User, label: 'Clients', path: '/dashboard/clients', hoverId: 'clients' },
    ],
    [
      { icon: Upload, label: 'Import factures', path: '/dashboard/import', hoverId: 'import_factures' },
      { icon: Calculator, label: 'Estimation automatique', path: '/dashboard/estimation', hoverId: 'estimation_automatique' },
    ],
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location === '/dashboard';
    return location === path || location.startsWith(`${path}?`);
  };

  return (
    <>
      <AccountBlock />

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-1">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <NavSeparator />}
            {group.map((item) => (
              <IconNavItem
                key={item.path}
                item={item}
                active={isActive(item.path)}
                setTooltip={setTooltip}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="pb-3">
        <NavSeparator />
        <div
          className="relative"
          onMouseEnter={(e) => {
            setHelpHovered(true);
            setTooltip({
              label: 'Aide',
              y: e.currentTarget.getBoundingClientRect().top + 12,
            });
          }}
          onMouseLeave={() => {
            setHelpHovered(false);
            setTooltip(null);
          }}
          onClick={onHelpClick}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '2px auto',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: helpHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
            }}
          >
            <HelpCircle
              className="h-5 w-5 shrink-0"
              style={{ color: helpHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}
            />
          </div>
        </div>
        <div
          className="relative"
          onMouseEnter={(e) => {
            setLogoutHovered(true);
            setTooltip({
              label: 'Se déconnecter',
              y: e.currentTarget.getBoundingClientRect().top + 12,
            });
          }}
          onMouseLeave={() => {
            setLogoutHovered(false);
            setTooltip(null);
          }}
          onClick={onLogoutClick}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '2px auto',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: logoutHovered ? 'rgba(239,68,68,0.1)' : 'transparent',
            }}
          >
            <LogOut
              className="h-5 w-5 shrink-0"
              style={{ color: logoutHovered ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,0.7)' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isOpen = useMobileNavStore((s) => s.isOpen);
  const close = useMobileNavStore((s) => s.close);

  useEffect(() => {
    close();
  }, [location, close]);

  const handleConfirmLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
    setLocation('/auth');
  };

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
          !isOpen && 'w-0 overflow-hidden',
        )}
        style={
          isOpen
            ? {
                width: '64px',
                minWidth: '64px',
                background: isLight ? 'hsl(205, 55%, 85%)' : undefined,
                borderRight: isLight ? '1px solid hsl(205, 40%, 78%)' : undefined,
              }
            : undefined
        }
      >
        {isOpen && (
          <SidebarContent
            onNavigate={close}
            setTooltip={setTooltip}
            onHelpClick={() => setShowHelpModal(true)}
            onLogoutClick={() => setShowLogoutModal(true)}
          />
        )}
      </aside>

      {showHelpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '360px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <i className="ti ti-lifebuoy" style={{ color: '#a78bfa', fontSize: '22px' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--foreground)' }}>Centre d&apos;aide</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>PLANCHAIS Support</div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  fontSize: '20px',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="mailto:support@planchais.fr"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <i className="ti ti-mail" style={{ color: '#a78bfa', fontSize: '20px' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--foreground)' }}>Email support</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>support@planchais.fr</div>
                </div>
                <i
                  className="ti ti-arrow-right"
                  style={{ marginLeft: 'auto', color: 'var(--muted-foreground)', fontSize: '16px' }}
                />
              </a>

              <a
                href="https://wa.me/33600000000"
                target="_blank"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <i className="ti ti-brand-whatsapp" style={{ color: '#22c55e', fontSize: '20px' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--foreground)' }}>WhatsApp</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Réponse rapide</div>
                </div>
                <i
                  className="ti ti-arrow-right"
                  style={{ marginLeft: 'auto', color: 'var(--muted-foreground)', fontSize: '16px' }}
                />
              </a>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                <i className="ti ti-book" style={{ color: '#3b82f6', fontSize: '20px' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--foreground)' }}>Documentation</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Guides et tutoriels</div>
                </div>
                <i
                  className="ti ti-arrow-right"
                  style={{ marginLeft: 'auto', color: 'var(--muted-foreground)', fontSize: '16px' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
              Disponible du Lun–Ven · 9h–18h
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div
          style={{
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{
              background: '#0a1628',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '320px',
              margin: 'auto',
              marginTop: '30vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'white' }}>
              Se déconnecter ?
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', margin: 0 }}>
              Vous allez être redirigé vers la page de connexion.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirmLogout();
                }}
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: '72px',
            top: tooltip.y,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(109,40,217,0.95))',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(124,58,237,0.4)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </>
  );
}
