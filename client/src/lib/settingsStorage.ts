const SETTINGS_KEY = "planchais.settings.v1"

export interface AppSettings {
  /** Nom affiché dans l'app (ex. en-tête documents) */
  nomAffiche: string
  /** Téléphone de contact affiché côté préférences */
  telephoneContact: string
  notifChantiers: boolean
  notifDevis: boolean
  /** Réduit les animations (classe sur documentElement) */
  reduireAnimations: boolean
  consentementStatsAnonymes: boolean
}

export const defaultSettings: AppSettings = {
  nomAffiche: "",
  telephoneContact: "",
  notifChantiers: true,
  notifDevis: true,
  reduireAnimations: false,
  consentementStatsAnonymes: false,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...defaultSettings }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...defaultSettings, ...parsed }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(next: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  applySettingsEffects(next)
}

/** Applique les effets globaux (animations, etc.) */
export function applySettingsEffects(s: AppSettings): void {
  document.documentElement.classList.toggle("reduce-motion", s.reduireAnimations)
}

/** À appeler au chargement de l'app pour réappliquer les préférences */
export function applySettingsFromStorage(): void {
  applySettingsEffects(loadSettings())
}
