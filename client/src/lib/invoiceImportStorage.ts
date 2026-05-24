import type { ExtractedInvoice, StoredInvoiceImport } from "@shared/invoiceTypes"

export const INVOICE_IMPORTS_KEY = "btp-invoice-imports"

export function loadStoredImports(): StoredInvoiceImport[] {
  try {
    const raw = localStorage.getItem(INVOICE_IMPORTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredInvoiceImport[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveStoredImport(entry: StoredInvoiceImport): void {
  const existing = loadStoredImports()
  localStorage.setItem(INVOICE_IMPORTS_KEY, JSON.stringify([entry, ...existing]))
}

export function removeStoredImport(id: string): void {
  const next = loadStoredImports().filter((item) => item.id !== id)
  if (next.length === 0) {
    localStorage.removeItem(INVOICE_IMPORTS_KEY)
  } else {
    localStorage.setItem(INVOICE_IMPORTS_KEY, JSON.stringify(next))
  }
}

export function clearStoredImports(): void {
  localStorage.removeItem(INVOICE_IMPORTS_KEY)
}

export function formatEuro(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "—"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount)
}

export type { ExtractedInvoice, StoredInvoiceImport }
