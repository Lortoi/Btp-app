import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Sidebar from '@/components/Sidebar'
import { AppTopBar } from '@/components/AppTopBar'
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
  Settings,
  Sparkles
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
          className="flex-1 flex flex-col relative z-10 lg:ml-64 lg:rounded-l-3xl overflow-hidden"
        >
        <AppTopBar />

        <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-border dark:border-gray-600 px-6 py-4 lg:rounded-tl-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground dark:text-white">
                Dashboard PLANCHAIS
              </h1>
              <p className="text-sm text-muted-foreground dark:text-gray-600 dark:text-gray-300">Construire pour durer</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-foreground dark:text-white border-border dark:border-white/20 hover:bg-muted dark:hover:bg-white/10"
                onClick={() => setLocation("/dashboard/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-gray-600 px-6 lg:rounded-tl-3xl">
          <div className="flex gap-2 overflow-x-auto">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard"
                    ? "bg-white/20 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-white/30"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                }
              >
                Vue d'ensemble
              </Button>
            </Link>
            <Link href="/dashboard/import">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/import"
                    ? "bg-white/20 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-white/30"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                }
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </Link>
            <Link href="/dashboard/quotes">
              <Button
                variant="ghost"
                size="sm"
                className={
                  location === "/dashboard/quotes"
                    ? "bg-white/20 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-white/30"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
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
                    ? "bg-white/20 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-white/30"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
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
                    ? "bg-white/20 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-white/30"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
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
                    ? "bg-white/20 backdrop-blur-md border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-white/30"
                    : "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
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
          className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
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
            <Euro className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€165,000</div>
            <p className="text-xs text-gray-600 dark:text-gray-300">+18.2% ce mois</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
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
            <Building className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-600 dark:text-gray-300">+3 en cours</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
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
            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Réponses attendues</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white cursor-pointer hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
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
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <p className="text-xs text-gray-600 dark:text-gray-300">+5.2% devis → chantiers</p>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden bg-black/20 backdrop-blur-xl border border-violet-500/30 text-gray-900 dark:text-white shadow-lg shadow-violet-950/20">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-primary/10"
          aria-hidden
        />
        <CardHeader className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-300" />
              <CardTitle className="text-lg">Importer vos anciennes factures (IA)</CardTitle>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
              Déposez vos PDF — extraction des clients, chantiers et montants. Données stockées dans votre espace
              Supabase (UE). Activez l&apos;Edge Function <code className="text-xs text-gray-900 dark:text-white">analyze-invoice</code> pour lancer l&apos;analyse.
            </p>
          </div>
          <Button
            type="button"
            className="relative shrink-0 bg-violet-600 hover:bg-violet-500 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
            onClick={() => setLocation("/dashboard/import")}
          >
            <Upload className="h-4 w-4 mr-2" />
            Commencer l&apos;import
          </Button>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">Aucune activité récente</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
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
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setLocation('/dashboard/import')}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer factures PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Les vues Devis/Chantiers/CRM/Planning (etc.) sont des pages dédiées
// accessibles via la sidebar (et via les boutons de navigation ci-dessus).
