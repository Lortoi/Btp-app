import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Euro } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <PageWrapper>
      <header className="surface-header backdrop-blur-sm px-6 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full max-w-full">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Suivi des Paiements
            </h1>
            <p className="text-sm text-subtitle">Facturation et gestion de trésorerie</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex items-center justify-center overflow-x-hidden w-full max-w-full">
        <Card className="w-full max-w-md text-center surface-card backdrop-blur-sm text-foreground hover-elevate">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 mx-auto rounded-xl bg-black/20 backdrop-blur-md border border-border flex items-center justify-center mb-4">
              <Euro className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-xl text-foreground">Gestion Financière</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-subtitle">
              Le module de suivi des paiements est en développement ! Gérez vos factures, 
              suivez vos encaissements et optimisez votre trésorerie.
            </p>
            <div className="space-y-2 text-sm text-subtitle">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-50 dark:bg-white/50 rounded-full"></div>
                <span>Facturation automatique</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-50 dark:bg-white/50 rounded-full"></div>
                <span>Suivi encaissements</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Relances automatiques</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
}