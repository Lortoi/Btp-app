const CRM_EMAIL_KEY = "planchais.crm.email.v1"

export type EmailProvider = "gmail" | "outlook" | "other"

export type CrmEmailConnection = {
  email: string
  provider: EmailProvider
  connectedAt: string
}

export function loadCrmEmailConnection(): CrmEmailConnection | null {
  try {
    const raw = localStorage.getItem(CRM_EMAIL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CrmEmailConnection
    if (!parsed?.email?.trim()) return null
    return parsed
  } catch {
    return null
  }
}

export function saveCrmEmailConnection(connection: CrmEmailConnection): void {
  localStorage.setItem(CRM_EMAIL_KEY, JSON.stringify(connection))
}

export function clearCrmEmailConnection(): void {
  localStorage.removeItem(CRM_EMAIL_KEY)
}

export function providerLabel(provider: EmailProvider): string {
  switch (provider) {
    case "gmail":
      return "Gmail"
    case "outlook":
      return "Outlook"
    default:
      return "Autre"
  }
}
