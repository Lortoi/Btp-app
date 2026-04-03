import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Sidebar from '@/components/Sidebar'
import { 
  Building, 
  FileText, 
  Wand2, 
  BarChart3,
  Users,
  Euro,
  TrendingUp,
  Clock,
  Plus,
  Upload,
  Calendar,
  Camera,
  Mail,
  Settings
} from 'lucide-react'
import { Link, useLocation } from 'wouter'
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const [location, setLocation] = useLocation();

  // Vérifier si l'utilisateur est un membre d'équipe et rediriger
  useEffect(() => {
    const userType = localStorage.getItem('userType')
    if (userType === 'team') {
      setLocation('/team-dashboard')
    }
  }, [setLocation])
  
  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Sidebar - now fixed, no animation */}
      <Sidebar />

      {/* Main Content - animated */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col relative z-10 ml-64 rounded-l-3xl overflow-hidden"
        >
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 py-4 rounded-tl-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Dashboard PLANCHAIS
              </h1>
              <p className="text-sm text-white/70">Construire pour durer</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
                onClick={() => setLocation("/dashboard/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-6 rounded-tl-3xl">
          <div className="flex gap-2 overflow-x-auto">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard"
                    ? "bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/30"
                    : "text-white hover:bg-white/10"
                }
              >
                Vue d'ensemble
              </Button>
            </Link>
            <Link href="/dashboard/quotes">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/quotes"
                    ? "bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/30"
                    : "text-white hover:bg-white/10"
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                Devis
              </Button>
            </Link>
            <Link href="/dashboard/projects">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/projects"
                    ? "bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/30"
                    : "text-white hover:bg-white/10"
                }
              >
                <Building className="h-4 w-4 mr-2" />
                Chantiers
              </Button>
            </Link>
            <Link href="/dashboard/crm">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/crm"
                    ? "bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/30"
                    : "text-white hover:bg-white/10"
                }
              >
                <Users className="h-4 w-4 mr-2" />
                CRM Pipeline
              </Button>
            </Link>
            <Link href="/dashboard/planning">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/planning"
                    ? "bg-white/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/30"
                    : "text-white hover:bg-white/10"
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                Planning
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <OverviewTab />
        </main>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Overview Tab Component
function OverviewTab() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          role="button"
          tabIndex={0}
          className="bg-black/20 backdrop-blur-xl border border-white/10 text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={() => setLocation('/dashboard/quotes')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setLocation('/dashboard/quotes');
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <Euro className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€165,000</div>
            <p className="text-xs text-white/70">+18.2% ce mois</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          className="bg-black/20 backdrop-blur-xl border border-white/10 text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={() => setLocation('/dashboard/projects')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setLocation('/dashboard/projects');
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chantiers Actifs</CardTitle>
            <Building className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-white/70">+3 en cours</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          className="bg-black/20 backdrop-blur-xl border border-white/10 text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={() => setLocation('/dashboard/quotes')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setLocation('/dashboard/quotes');
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devis En Attente</CardTitle>
            <FileText className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-white/70">Réponses attendues</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          className="bg-black/20 backdrop-blur-xl border border-white/10 text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={() => setLocation('/dashboard/crm')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setLocation('/dashboard/crm');
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <p className="text-xs text-white/70">+5.2% devis → chantiers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/70">Aucune activité récente</p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => {
                setLocation('/dashboard/projects?openDialog=true')
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Chantier
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation('/dashboard/quotes')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Créer un Devis
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation('/dashboard/estimation')}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Estimation IA
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Les vues Devis/Chantiers/CRM/Planning (etc.) sont des pages dédiées
// accessibles via la sidebar (et via les boutons de navigation ci-dessus).
