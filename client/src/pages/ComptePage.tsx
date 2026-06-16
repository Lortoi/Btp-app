import { useCallback, useEffect, useRef, useState } from "react"
import { Save } from "lucide-react"
import { PageWrapper } from "@/components/PageWrapper"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useCardHover } from '@/hooks/useCardHover'
import {
  fetchUserCompanyProfile,
  updateUserCompanyProfile,
  type UserCompanyProfile,
} from "@/lib/supabase"
import { loadSettings } from "@/lib/settingsStorage"

const inputBaseStyle: React.CSSProperties = {
  background: "var(--input)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "inherit",
  width: "100%",
  fontSize: "14px",
  transition: "border-color 0.2s",
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "6px",
  display: "block",
}

const defaultForm = {
  nomEntreprise: "Dupont Rénovation",
  logoBase64: null as string | null,
  adresse: "",
  siret: "",
  email: "",
  telephone: "",
  tva: "",
}

function formatRenewalDate(value: string | null | undefined): string {
  if (!value) return "—"
  const [y, m, d] = value.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return value
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function getEntrepriseInitials(nom: string): string {
  const parts = nom.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }
  return nom.slice(0, 2).toUpperCase()
}

function applyProfileToForm(profile: UserCompanyProfile | null) {
  const settings = loadSettings()
  return {
    nomEntreprise:
      profile?.nom_entreprise?.trim() ||
      profile?.full_name?.trim() ||
      settings.nomAffiche ||
      defaultForm.nomEntreprise,
    logoBase64: profile?.logo_base64 ?? null,
    adresse: profile?.adresse ?? "",
    siret: profile?.siret ?? "",
    email: profile?.email ?? "",
    telephone: profile?.telephone ?? settings.telephoneContact ?? "",
    tva: profile?.tva_intracom ?? "",
  }
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  accentColor: string
}

function FieldInput({ label, id, accentColor, style, onFocus, onBlur, ...props }: FieldInputProps) {
  return (
    <div>
      <label htmlFor={id} style={{ ...labelStyle, color: accentColor }}>
        {label}
      </label>
      <input
        id={id}
        style={{ ...inputBaseStyle, ...style }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = accentColor
          onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border)"
          onBlur?.(e)
        }}
        {...props}
      />
    </div>
  )
}

export default function ComptePage() {
  const { toast } = useToast()
  const { getHoverProps, getHoverStyle } = useCardHover()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(defaultForm)
  const [plan, setPlan] = useState("pro")
  const [planRenewalDate, setPlanRenewalDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const profile = await fetchUserCompanyProfile()
      setForm(applyProfileToForm(profile))
      setPlan(profile?.plan ?? "pro")
      setPlanRenewalDate(profile?.plan_renewal_date ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logoBase64: reader.result as string }))
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateUserCompanyProfile({
        nom_entreprise: form.nomEntreprise.trim(),
        logo_base64: form.logoBase64,
        adresse: form.adresse.trim(),
        siret: form.siret.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        tva_intracom: form.tva.trim(),
      })

      if (updated) {
        setForm(applyProfileToForm(updated))
        setPlan(updated.plan ?? "pro")
        setPlanRenewalDate(updated.plan_renewal_date ?? null)
        toast({
          title: "Profil enregistré",
          description: "Les informations de votre entreprise ont été mises à jour.",
        })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer le profil. Vérifiez votre connexion.",
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Pro"

  return (
    <PageWrapper>
      <header className="surface-header backdrop-blur-sm px-6 py-4 rounded-tl-3xl">
        <h1
          className="text-2xl font-bold tracking-tight text-white"
          style={{ letterSpacing: "-0.03em" }}
        >
          Mon Compte
        </h1>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-5xl overflow-x-hidden w-full">
        <Card
          className="surface-card backdrop-blur-sm text-foreground overflow-hidden"
          {...getHoverProps('compte_profil')}
          style={{
            borderLeft: "4px solid #7c3aed",
            background: "linear-gradient(135deg, rgba(124,58,237,0.08), transparent)",
            borderRadius: "12px",
            padding: "32px",
            ...getHoverStyle('compte_profil', '#7c3aed'),
          }}
        >
          <CardContent className="p-0">
            <form onSubmit={handleSave}>
              <div
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: "24px" }}
              >
                {/* Colonne gauche — profil */}
                <div className="flex flex-col items-center text-center">
                  {form.logoBase64 ? (
                    <img
                      src={form.logoBase64}
                      alt="Logo entreprise"
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        margin: "0 auto",
                        border: "2px solid rgba(255,255,255,0.1)",
                        boxShadow:
                          "0 0 0 4px rgba(124,58,237,0.3), 0 8px 32px rgba(124,58,237,0.2)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #e8702a, #7c3aed)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "42px",
                        fontWeight: 700,
                        color: "white",
                        margin: "0 auto",
                        boxShadow:
                          "0 0 0 4px rgba(124,58,237,0.3), 0 8px 32px rgba(124,58,237,0.2)",
                      }}
                    >
                      {getEntrepriseInitials(form.nomEntreprise)}
                    </div>
                  )}

                  <p
                    className="mt-4 text-white"
                    style={{ fontWeight: 700, fontSize: "20px" }}
                  >
                    {form.nomEntreprise || "Mon entreprise"}
                  </p>

                  <span
                    className="mt-3 inline-block"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))",
                      border: "1px solid rgba(124,58,237,0.4)",
                      borderRadius: "20px",
                      padding: "4px 14px",
                      color: "#a78bfa",
                      fontSize: "13px",
                    }}
                  >
                    Pro
                  </span>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={loading}
                    onChange={onLogoChange}
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => logoInputRef.current?.click()}
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      background: "transparent",
                      color: "var(--muted-foreground)",
                      fontSize: "13px",
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: "12px",
                    }}
                  >
                    Changer le logo
                  </button>
                </div>

                {/* Colonne droite — formulaire */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                  <FieldInput
                    id="nom-entreprise"
                    label="Nom de l'entreprise"
                    accentColor="#e8702a"
                    type="text"
                    required
                    disabled={loading}
                    value={form.nomEntreprise}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nomEntreprise: e.target.value }))
                    }
                  />
                  <FieldInput
                    id="siret-entreprise"
                    label="SIRET"
                    accentColor="#f59e0b"
                    type="text"
                    disabled={loading}
                    value={form.siret}
                    onChange={(e) => setForm((prev) => ({ ...prev, siret: e.target.value }))}
                  />
                  <FieldInput
                    id="email-entreprise"
                    label="Email de contact"
                    accentColor="#3b82f6"
                    type="email"
                    disabled={loading}
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <FieldInput
                    id="telephone-entreprise"
                    label="Téléphone"
                    accentColor="#22c55e"
                    type="text"
                    disabled={loading}
                    value={form.telephone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, telephone: e.target.value }))
                    }
                  />
                  <div className="sm:col-span-2">
                    <FieldInput
                      id="adresse-entreprise"
                      label="Adresse"
                      accentColor="#7c3aed"
                      type="text"
                      disabled={loading}
                      value={form.adresse}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, adresse: e.target.value }))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldInput
                      id="tva-entreprise"
                      label="TVA"
                      accentColor="#a78bfa"
                      type="text"
                      disabled={loading}
                      value={form.tva}
                      onChange={(e) => setForm((prev) => ({ ...prev, tva: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={saving || loading}
                      style={{
                        background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px 28px",
                        cursor: saving || loading ? "not-allowed" : "pointer",
                        fontWeight: 500,
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "8px",
                        opacity: saving || loading ? 0.7 : 1,
                      }}
                    >
                      <Save className="h-4 w-4" aria-hidden />
                      {saving ? "Enregistrement…" : "Sauvegarder"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card
          className="surface-card backdrop-blur-sm text-foreground overflow-hidden"
          {...getHoverProps('compte_plan')}
          style={{
            borderLeft: "4px solid #7c3aed",
            background: "linear-gradient(135deg, rgba(124,58,237,0.08), transparent)",
            borderRadius: "12px",
            padding: "20px 24px",
            ...getHoverStyle('compte_plan', '#7c3aed'),
          }}
        >
          <CardContent className="p-0 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-subtitle">Plan actuel</span>
                <span
                  style={{
                    background: "rgba(124,58,237,0.2)",
                    color: "#a78bfa",
                    border: "1px solid rgba(124,58,237,0.35)",
                    borderRadius: "9999px",
                    padding: "4px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {planLabel}
                </span>
              </div>
              <p className="text-sm text-subtitle">
                Date de renouvellement :{" "}
                <span className="text-foreground font-medium">
                  {formatRenewalDate(planRenewalDate)}
                </span>
              </p>
            </div>
            <p style={{ color: "#22c55e", fontSize: "13px", fontWeight: 500 }}>
              ✓ Licence à vie — aucun abonnement requis
            </p>
          </CardContent>
        </Card>
      </main>
    </PageWrapper>
  )
}
