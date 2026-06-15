import type { CSSProperties } from "react"

/** Fond gradient premium partagé par tous les layouts dashboard */
export const dashboardLayoutStyle: CSSProperties = {
  background: "radial-gradient(ellipse at top, #0d1b3e 0%, #080d1a 60%)",
  minHeight: "100vh",
}

export const dashboardLayoutClass = "dashboard-layout relative min-h-screen overflow-hidden"
