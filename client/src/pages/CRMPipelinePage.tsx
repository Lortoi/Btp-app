import { PageWrapper } from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { CRMPipeline } from '@/components/CRMPipeline';

export default function CRMPipelinePage() {
  return (
    <PageWrapper>
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 rounded-tl-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CRM Pipeline
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Gérez vos prospects et automatisez vos workflows</p>
          </div>
          <Button className="bg-gray-100 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-white/30">
            <Mail className="h-4 w-4 mr-2" />
            Connecter Email
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div
          className="flex items-center justify-between gap-3 rounded-xl max-h-12 min-h-[44px] px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-gray-600 backdrop-blur-md"
          role="region"
          aria-label="Configuration email"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-300" />
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
              Connectez votre email pour activer les automatisations
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-gray-900 dark:text-white border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 h-8 text-xs"
          >
            Connecter
          </Button>
        </div>

        <CRMPipeline />
      </main>
    </PageWrapper>
  );
}
