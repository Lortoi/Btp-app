import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <PageWrapper>
      <header className="surface-header backdrop-blur-sm px-6 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full max-w-full">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Analytics Avancées
            </h1>
            <p className="text-sm text-subtitle">Analysez vos performances et optimisez votre activité</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex items-center justify-center overflow-x-hidden w-full max-w-full">
        <Card className="w-full max-w-md text-center surface-card backdrop-blur-sm text-foreground hover-elevate">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 mx-auto rounded-xl bg-black/20 backdrop-blur-md border border-border flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-cyan-500" />
            </div>
            <CardTitle className="text-xl text-foreground">Rapports Détaillés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-subtitle">
              Le module d'analytics arrive bientôt ! Analysez vos performances, 
              identifiez les tendances et optimisez votre rentabilité.
            </p>
            <div className="space-y-2 text-sm text-subtitle">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-50 dark:bg-white/50 rounded-full"></div>
                <span>Tableaux de bord</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-50 dark:bg-white/50 rounded-full"></div>
                <span>Rapports automatisés</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Analyses prédictives</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
}