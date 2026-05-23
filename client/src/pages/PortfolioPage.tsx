import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';

export default function PortfolioPage() {
  return (
    <PageWrapper>
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-gray-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Portfolio Avant/Après
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Showcasez vos réalisations avec style</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md text-center bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover-elevate">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 mx-auto rounded-xl bg-black/20 backdrop-blur-md border border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-pink-500" />
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-white">Portfolio Professionnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Le module portfolio arrive prochainement ! Créez des galeries avant/après 
              impressionnantes et générez des PDF pour vos clients.
            </p>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-50 dark:bg-white/50 rounded-full"></div>
                <span>Galeries avant/après</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-50 dark:bg-white/50 rounded-full"></div>
                <span>Génération PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Partage clients</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  );
}