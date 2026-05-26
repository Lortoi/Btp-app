/** ID unique compatible mobile (HTTP non sécurisé, Safari ancien). */
export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID()
    } catch {
      // Secure context requis sur certains navigateurs mobiles
    }
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
