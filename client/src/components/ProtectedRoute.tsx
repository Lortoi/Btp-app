import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const isAuthBypassEnabled = sessionStorage.getItem("authBypass") === "true";

  useEffect(() => {
    if (!loading && !user && !isAuthBypassEnabled) {
      setLocation('/auth');
    }
  }, [user, loading, isAuthBypassEnabled, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  if (!user && !isAuthBypassEnabled) {
    return null;
  }

  return <>{children}</>;
}

