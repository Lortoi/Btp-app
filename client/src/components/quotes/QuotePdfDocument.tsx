import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
import type { QuoteDraft, QuoteTotals } from "./quoteTypes"
import { uniteLabel } from "./quoteTypes"

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    backgroundColor: "#1e3a5f",
    color: "#ffffff",
    padding: 16,
    flexDirection: "row",
    gap: 16,
  },
  logoBox: {
    width: 72,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRight: { flex: 1 },
  companyName: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  muted: { color: "rgba(255,255,255,0.85)", fontSize: 8, marginBottom: 2 },
  body: { paddingTop: 16, backgroundColor: "#f8fafc" },
  titleBlock: { alignItems: "center", marginBottom: 16 },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    letterSpacing: 1,
  },
  subtitle: { fontSize: 10, marginTop: 4 },
  clientBox: {
    borderWidth: 2,
    borderColor: "#cbd5e1",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#ffffff",
  },
  clientTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  table: { marginBottom: 12 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  th: {
    backgroundColor: "#1e3a5f",
    color: "#ffffff",
    padding: 6,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  td: { padding: 6, fontSize: 8 },
  tdAlt: { backgroundColor: "#f1f5f9" },
  totals: { alignItems: "flex-end", marginBottom: 12 },
  totalsBox: { width: 200 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  ttcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: "#1e3a5f",
  },
  ttcAmount: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1e3a5f" },
  decBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginBottom: 4,
  },
  footer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e2e8f0", fontSize: 8, color: "#64748b" },
})

interface Props {
  draft: QuoteDraft
  totals: QuoteTotals
}

export function QuotePdfDocument({ draft, totals }: Props) {
  const totalsById = new Map(totals.ligneTotals.map((x) => [x.id, x.totalHT]))
  const societe = draft.company.formeJuridique !== "auto-entrepreneur"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            {draft.company.logoBase64 ? (
              <Image
                src={draft.company.logoBase64}
                style={{ maxWidth: 68, maxHeight: 68, objectFit: "contain" }}
              />
            ) : (
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 7 }}>Logo</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>
              {draft.company.raisonSociale || "Raison sociale"}
            </Text>
            <Text style={styles.muted}>{draft.company.adresse || "Adresse"}</Text>
            {draft.company.siret ? (
              <Text style={styles.muted}>SIRET : {draft.company.siret}</Text>
            ) : null}
            {draft.company.tvaIntra ? (
              <Text style={styles.muted}>TVA : {draft.company.tvaIntra}</Text>
            ) : null}
            {societe && draft.company.capitalSocial ? (
              <Text style={styles.muted}>Capital social : {draft.company.capitalSocial}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>DEVIS</Text>
            <Text style={styles.subtitle}>
              N° {draft.devis.numero || "—"} · Date : {formatFr(draft.devis.dateEmission)}
            </Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
              Validité : {draft.devis.validiteJours} jours
            </Text>
          </View>

          <View style={styles.clientBox}>
            <Text style={styles.clientTitle}>Client</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>
              {draft.client.nom || "—"}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 9 }}>{draft.client.adresse || "—"}</Text>
            {(draft.client.email || draft.client.phone) && (
              <View style={{ marginTop: 6 }}>
                {draft.client.email ? (
                  <Text style={{ fontSize: 8, color: "#475569" }}>
                    Email : {draft.client.email}
                  </Text>
                ) : null}
                {draft.client.phone ? (
                  <Text style={{ fontSize: 8, color: "#475569" }}>
                    Tél. : {draft.client.phone}
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.table}>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={[styles.th, { flex: 3 }]}>Description</Text>
              <Text style={[styles.th, { width: 36, textAlign: "right" }]}>Qté</Text>
              <Text style={[styles.th, { width: 36, textAlign: "center" }]}>Unité</Text>
              <Text style={[styles.th, { width: 56, textAlign: "right" }]}>PU HT</Text>
              <Text style={[styles.th, { width: 56, textAlign: "right" }]}>Total HT</Text>
            </View>
            {draft.lignes.map((l, i) => (
              <View
                key={l.id}
                wrap={false}
                style={[
                  styles.row,
                  i % 2 === 1 ? styles.tdAlt : { backgroundColor: "#ffffff" },
                ]}
              >
                <Text style={[styles.td, { flex: 3 }]}>{l.description || "—"}</Text>
                <Text style={[styles.td, { width: 36, textAlign: "right" }]}>
                  {String(l.quantity)}
                </Text>
                <Text style={[styles.td, { width: 36, textAlign: "center" }]}>
                  {uniteLabel(l.unite)}
                </Text>
                <Text style={[styles.td, { width: 56, textAlign: "right" }]}>
                  {l.puHT.toFixed(2)} €
                </Text>
                <Text style={[styles.td, { width: 56, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                  {(totalsById.get(l.id) ?? 0).toFixed(2)} €
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={styles.totalsBox}>
              <View style={styles.totalRow}>
                <Text>Total HT</Text>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{totals.totalHT.toFixed(2)} €</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>TVA ({totals.tvaLabel})</Text>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  {totals.montantTVA.toFixed(2)} €
                </Text>
              </View>
              <View style={styles.ttcRow}>
                <Text style={{ fontFamily: "Helvetica-Bold", color: "#1e3a5f" }}>Total TTC</Text>
                <Text style={styles.ttcAmount}>{totals.totalTTC.toFixed(2)} €</Text>
              </View>
            </View>
          </View>

          <View style={styles.decBox}>
            <Text style={styles.sectionTitle}>Assurance décennale</Text>
            <Text style={{ fontSize: 8, marginBottom: 2 }}>
              Assureur : {draft.company.decennale.assureur || "—"}
            </Text>
            <Text style={{ fontSize: 8, marginBottom: 2 }}>
              N° contrat : {draft.company.decennale.contrat || "—"}
            </Text>
            <Text style={{ fontSize: 8 }}>
              Zone couverte : {draft.company.decennale.zone || "—"}
            </Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Modalités de paiement</Text>
            <Text style={{ fontSize: 8 }}>{draft.financier.modalitesPaiement || "—"}</Text>
          </View>
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Pénalités de retard</Text>
            <Text style={{ fontSize: 8 }}>{draft.financier.penalitesRetard || "—"}</Text>
          </View>

          {draft.notes.trim() ? (
            <View style={[styles.decBox, { marginBottom: 8 }]}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={{ fontSize: 8 }}>{draft.notes}</Text>
            </View>
          ) : null}

          <Text style={styles.footer}>
            Bon pour accord — Date : ___ — Signature : ___
          </Text>
        </View>
      </Page>
    </Document>
  )
}

function formatFr(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR")
}
