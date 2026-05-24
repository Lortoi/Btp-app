import type { ChantierVisionReport } from "@shared/chantierVisionTypes"

export function exportChantierReportPdf(params: {
  report: ChantierVisionReport
  workTypeLabel: string
  goalDescription: string
  imageDataUrl?: string
}): void {
  const { report, workTypeLabel, goalDescription, imageDataUrl } = params
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const travauxHtml = report.travaux_necessaires
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join("")

  const materiauxHtml = report.recommandations_materiaux
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join("")

  const lignesHtml = report.lignes_devis
    .map(
      (l) =>
        `<tr>
          <td>${escapeHtml(l.description)}</td>
          <td style="text-align:right">${l.quantity}</td>
          <td>${escapeHtml(l.unite)}</td>
          <td style="text-align:right">${l.puHT.toLocaleString("fr-FR")} €</td>
        </tr>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Rapport Visualisation IA — ${escapeHtml(workTypeLabel)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #111; max-width: 800px; margin: 0 auto; padding: 32px; line-height: 1.5; }
    h1 { color: #5b21b6; font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
    h2 { color: #5b21b6; font-size: 1.1rem; margin-top: 24px; border-bottom: 2px solid #ddd6fe; padding-bottom: 4px; }
    ul { padding-left: 1.25rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.875rem; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f3ff; }
    img { max-width: 100%; max-height: 280px; border-radius: 8px; margin-top: 8px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Rapport Visualisation IA — Chantier BTP</h1>
  <p class="meta">${date} · ${escapeHtml(workTypeLabel)}</p>
  <p><strong>Objectif :</strong> ${escapeHtml(goalDescription)}</p>
  ${imageDataUrl ? `<img src="${imageDataUrl}" alt="Photo chantier" />` : ""}
  <h2>Description du rendu final</h2>
  <p>${escapeHtml(report.description_rendu)}</p>
  <h2>Travaux nécessaires</h2>
  <ul>${travauxHtml}</ul>
  <h2>Estimation du temps de chantier</h2>
  <p>${escapeHtml(report.estimation_temps)}</p>
  <h2>Recommandations matériaux</h2>
  <ul>${materiauxHtml}</ul>
  <h2>Estimation devis (HT)</h2>
  <table>
    <thead><tr><th>Prestation</th><th>Qté</th><th>Unité</th><th>PU HT</th></tr></thead>
    <tbody>${lignesHtml}</tbody>
  </table>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const win = window.open("", "_blank")
  if (!win) return
  win.document.write(html)
  win.document.close()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
