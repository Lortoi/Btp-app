import { ShaderBackground } from "@/components/ShaderBackground"

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:hidden" />
      <div className="absolute inset-0 hidden dark:block">
        <ShaderBackground />
        <div className="absolute inset-0 pointer-events-none bg-black/20" />
      </div>
    </div>
  )
}
