import { ShaderBackground } from "@/components/ShaderBackground"

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none">
      <ShaderBackground />
      <div className="absolute inset-0 pointer-events-none bg-white/10 dark:bg-black/20" />
    </div>
  )
}
