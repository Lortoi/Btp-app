import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMobileNavStore } from '@/stores/mobileNavStore';
import { 
  Home, 
  Building,
  Calendar,
  X,
} from 'lucide-react';

export default function TeamSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
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
    { icon: Home, label: 'Vue d\'ensemble', path: '/team-dashboard', active: location === '/team-dashboard' },
    { icon: Building, label: 'Mes Chantiers', path: '/team-dashboard/projects', active: location === '/team-dashboard/projects' },
    { icon: Calendar, label: 'Planning', path: '/team-dashboard/planning', active: location === '/team-dashboard/planning' },
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
          "fixed left-0 top-0 h-screen bg-white/90 dark:bg-black/20 backdrop-blur-xl border-r border-border dark:border-gray-600 transition-all duration-300 ease-in-out flex flex-col z-50 rounded-r-3xl",
          collapsed ? "w-16" : "w-64 max-w-[80vw]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-gray-600">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground dark:text-white">Membre d'équipe</span>
          <span className="text-xs text-muted-foreground dark:text-subtitle italic">PLANCHAIS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {!collapsed && (
          <div className="text-xs font-medium text-secondary uppercase tracking-wide mb-4">
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
                item.active && "bg-white/20 backdrop-blur-md border border-border text-foreground hover:bg-white/30",
                !item.active && "hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}
      </nav>
      </div>
    </>
  );
}

