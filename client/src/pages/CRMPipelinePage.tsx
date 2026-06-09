import { PageWrapper } from "@/components/PageWrapper"
import { CRMPipeline } from "@/components/CRMPipeline"

export default function CRMPipelinePage() {
  return (
    <PageWrapper>
      <header className="bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-6 py-4 rounded-tl-3xl">
        <h1 className="text-2xl font-bold text-foreground">CRM Pipeline</h1>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-x-hidden w-full max-w-full">
        <CRMPipeline />
      </main>
    </PageWrapper>
  )
}
