# Audit Responsive — BTP App

> Cible : 320–767 px (📱), 768–1023 px (📱 tablette), 1024–1439 px (💻), 1440 px+ (🖥️).
> Breakpoints Tailwind utilisés : `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

---

## 1. Layout & Navigation

### 1.1 Sidebar — `client/src/components/Sidebar.tsx`
| # | Lignes | Problème actuel sur mobile | Solution responsive |
|---|--------|---------------------------|---------------------|
| 1 | 46–49 | Sidebar **toujours fixe `w-64`** sur tous les viewports. Combinée à `ml-64` côté contenu, la zone utile disparaît sous 1024 px. | Drawer : `fixed -translate-x-full lg:translate-x-0`, plus un overlay `bg-black/50` ouvert via bouton hamburger. `w-64 max-w-[80vw]`. |
| 2 | 23–24 | `useState collapsed/setCollapsed` jamais piloté par l'UI → code mort. | Remplacer par `useMobileNavStore` (zustand) avec `isOpen / open / close / toggle`. |
| 3 | 70–74 | Boutons nav `h-10` (40 px) — sous le seuil 44 px tactile. | `min-h-11 lg:min-h-10`. |
| 4 | 93–95 | Actions rapides `size="sm"` → `min-h-8` (32 px). | `min-h-11 lg:min-h-9`. |

### 1.2 TeamSidebar — `client/src/components/TeamSidebar.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 21–25 | Même sidebar `fixed w-64` sans variante mobile. | Même drawer que §1.1 (réutilise le store partagé). |
| 2 | 12–13, 24 | `collapsed/setCollapsed` jamais utilisé. | Supprimer ou brancher au store. |
| 3 | 46–48 | Boutons nav `h-10`. | `min-h-11 lg:min-h-10`. |

### 1.3 PageWrapper — `client/src/components/PageWrapper.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 72 | `ml-64` appliqué partout → contenu poussé hors viewport sous lg. | `ml-0 lg:ml-64` + `rounded-l-3xl` → `lg:rounded-l-3xl`. |
| 2 | — | Pas de top-bar mobile (hamburger). | Insérer une top-bar `lg:hidden sticky top-0 z-30` avec `MobileMenuButton`. |

### 1.4 Header (landing) — `client/src/components/Header.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 16 | `flex justify-between` sans wrap → compression titre/bouton. | `flex-wrap gap-y-2` + `min-w-0` sur le titre + `shrink-0` sur le bouton. |
| 2 | 47–55 | Bouton menu mobile `size="icon"` = 36×36 px. | `min-h-11 min-w-11`. |

### 1.5 App — `client/src/App.tsx`
Aucun souci direct (routes uniquement). Tout se règle côté `PageWrapper` / pages dashboard.

---

## 2. Pages avec sidebar — `ml-64` sans `lg:` (header + main)

### 2.1 Dashboard — `client/src/pages/Dashboard.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 53 | `ml-64 rounded-l-3xl` figé. | `lg:ml-64 lg:rounded-l-3xl`. |
| 2 | 55–75 | Header `flex items-center justify-between` ne wrap pas. | `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` + `min-w-0` sur le titre. |
| 3 | 55, 79, 154, 169 | `px-6 py-4`, `p-6`, `gap-6` fixes. | `px-4 sm:px-6 py-3 sm:py-4`, `p-4 sm:p-6`, `gap-4 sm:gap-6`. |
| 4 | 58 | `h1 text-2xl` fixe. | `text-xl sm:text-2xl lg:text-3xl`. |
| 5 | 169 | KPI : `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`. | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. |
| 6 | 80 | Tabs navigation : `overflow-x-auto` déjà présent — OK. | RAS. |

### 2.2 TeamDashboard — `client/src/pages/TeamDashboard.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 56 | `ml-64 rounded-l-3xl`. | `lg:ml-64 lg:rounded-l-3xl` + top-bar mobile. |
| 2 | 59–68, 72, 104 | Mêmes patterns `px-6 py-4`, `p-6`. | Mêmes ajustements que 2.1. |
| 3 | 154–169 | Lignes chantier `flex items-center justify-between` → texte long + badge se chevauchent. | `flex-col gap-2 items-stretch sm:flex-row sm:items-center sm:justify-between`. |

### 2.3 EstimationPage — `client/src/pages/EstimationPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 291–337 | `ProgressSteps` : `flex items-center gap-3` débordement horizontal mobile (3 étapes + séparateurs). | `flex flex-wrap gap-y-2 justify-center sm:justify-start` ou wrapper `overflow-x-auto`. |
| 3 | 298–331 | Pastilles `h-7 w-7` + labels `text-xs` serrés. | Au moins `flex-wrap`. |
| 4 | 416 | Grille miniatures `grid-cols-3`. | `grid-cols-2 sm:grid-cols-3`. |
| 5 | 424–428 | Bouton supprimer photo `h-7 w-7` + `group-hover:opacity-100` (pas de hover au touch). | `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`, `min-h-9 min-w-9`. |
| 6 | 800–807 | Bouton « aide TVA » `text-xs` ≈ lien minuscule. | Envelopper dans `<Button size="sm" min-h-11 px-3>`. |
| 7 | 859–876 | Footer étape : `flex justify-between` deux gros boutons coincés. | `flex-col-reverse gap-3 sm:flex-row sm:justify-between` ; boutons `w-full sm:w-auto`. |
| 8 | 926–952 | `<table>` résultat avec `overflow-x-auto` (scroll horizontal) mais pas d'alternative cards. | Variante mobile : `md:hidden` cards empilées + `hidden md:table`. |

### 2.4 ProjectsPage — `client/src/pages/ProjectsPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 243–251, 389 | Header `flex justify-between` + boutons sans wrap. | `flex-col gap-3 sm:flex-row sm:justify-between`. |
| 3 | 265–387 | `DialogContent max-w-2xl` sans `max-h` ; formulaire long peut dépasser verticalement (clavier iOS). | Ajouter `max-h-[85vh] overflow-y-auto` sur `DialogContent`. |
| 4 | 282–306 | Client + bouton `Plus` côte-à-côte (`flex gap-2`). | `flex flex-col sm:flex-row gap-2`, Select `w-full`. |
| 5 | 309–328 | Dates : `grid grid-cols-2` trop étroit en mobile. | `grid-cols-1 sm:grid-cols-2`. |
| 6 | 350 | Vignettes `grid-cols-4` minuscules. | `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`. |
| 7 | 358–362 | Bouton fermer vignette `h-7 w-7`. | `min-h-10 min-w-10`. |
| 8 | 394, 429, 496 | Grilles `grid-cols-1 md:grid-cols-3` / `md:grid-cols-2` OK ; `gap-4`/`gap-6` constants. | `gap-3 sm:gap-4` et `gap-4 sm:gap-6`. |

### 2.5 PlanningPage — `client/src/pages/PlanningPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 413–459 | Barre contrôles calendrier (flèches + select mois + select année + bouton « Aujourd'hui ») : `flex justify-between` débordement fort. | `flex flex-wrap gap-2` ; selects `flex-1 sm:flex-none` ; boutons tactiles `min-h-11 min-w-11`. |
| 3 | 467–493 | Grille `grid-cols-7` + `min-h-[120px]` → cellules ~50 px sur 375 px, illisibles. | Choix : (A) réduire `min-h-[64px] sm:min-h-[120px]`, `p-1 sm:p-2`, `gap-1 sm:gap-2`, texte plus petit ; (B) vue liste agenda sous `md`. Solution préférée : A pour rester proche du design existant. |
| 4 | 508–557 | Pastilles événements `py-0.5` et barres chantier `min-h-0` — zones tactiles minuscules. | `min-h-[20px]` minimum, `text-[10px] sm:text-xs`. |
| 5 | 620–658 | Dialog RDV : `Input` date + 2 boutons `← →` côte-à-côte. | `flex flex-wrap gap-2`, boutons `shrink-0 min-h-11 min-w-11`. |
| 6 | 675–684 | Boutons flèche heures `h-9 w-9`. | `h-11 w-11`. |
| 7 | 771–779 | Liste « Chantiers du mois » : client + dates sur la même ligne `flex gap-4`. | `flex-col sm:flex-row sm:gap-4`. |

### 2.6 CRMPipelinePage — `client/src/pages/CRMPipelinePage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 9–20 | Header titre + bouton « Connecter Email » sans wrap. | `flex-col gap-3 sm:flex-row sm:justify-between`. |
| 3 | 26–43 | Bandeau notice : bouton `h-8 text-xs` (32 px). | `flex-col gap-2 sm:flex-row sm:items-center` ; bouton `min-h-11`. |

### 2.7 CRMPipeline (kanban) — `client/src/components/CRMPipeline.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 134–141 | Déjà adaptatif (`flex-col gap-4 md:flex-row md:overflow-x-auto md:gap-3`). | Pas d'action requise. Optionnel : `snap-x snap-mandatory` pour swipe horizontal sous `md`. |

### 2.8 QuotesPage — `client/src/pages/QuotesPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 268–272 | Header `flex justify-between`. | `flex-col gap-3 sm:flex-row sm:justify-between`. |
| 3 | 226–247 | Liste devis sauvegardés : ligne `flex justify-between` + icône trash 36×36. | `flex-col items-stretch sm:flex-row sm:items-center` ; icône `h-11 w-11`. |
| 4 | 275–355 | Onglets `md:hidden` + split `hidden md:flex` déjà en place. | Pattern OK. RAS. |
| 5 | 706–781 | Lignes de prestation : `lg:grid-cols-12` empilé sous lg → OK ; bouton supprimer ligne `size="icon"`. | `h-11 w-11`. |
| 6 | 522 | Section `Décennale` `md:grid-cols-3` OK. | RAS. |

### 2.9 QuotePreview — `client/src/components/quotes/QuotePreview.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 15–49 | En-tête `flex gap-6 items-start` : logo + texte trop serrés sur mobile. | `flex flex-col sm:flex-row sm:gap-6`. |
| 2 | 86–119 | `<table>` lignes prestation : `overflow-x-auto` parent — scroll horizontal possible mais pas idéal. | Conserver scroll, réduire `text-[10px] sm:text-xs` sur `<th>/<td>` ; ou variante cards mobile (optionnel). |

### 2.10 AIVisualizationPage — `client/src/pages/AIVisualizationPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 87–102 | Header `flex justify-between` + 4 badges étapes sans wrap. | `flex-col gap-3 lg:flex-row lg:justify-between` ; badges `flex flex-wrap gap-2` ou conteneur `overflow-x-auto`. |
| 3 | 276–289 | Carte résultat : `CardHeader flex-row justify-between` + 2 boutons. | `flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`. |
| 4 | 327–335 | Détails projet : `grid grid-cols-2` libellés longs. | `grid-cols-1 sm:grid-cols-2`. |

### 2.11 TeamPage — `client/src/pages/TeamPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 206–213 | Header + dialog trigger sans wrap. | `flex-col gap-3 sm:flex-row sm:justify-between`. |
| 3 | 407–433 | Lignes membres : email/tel `flex gap-4` débordement. | `flex flex-col lg:flex-row lg:gap-4` + `truncate` / `break-all` sur email. |
| 4 | 579–595 | Dialog invitation : `Input` + bouton copier sans wrap. | `flex-col sm:flex-row`, bouton `w-full sm:w-auto`. |

### 2.12 ClientsPage — `client/src/pages/ClientsPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | via `PageWrapper` | `ml-64`. | cf. §1.3. |
| 2 | 37–47 | Header `flex justify-between` sans wrap. | `flex-col gap-3 sm:flex-row sm:justify-between`. |
| 3 | 122 | Grille clients `md:grid-cols-2 lg:grid-cols-3`. | `sm:grid-cols-2 lg:grid-cols-3` (passe à 2 cols plus tôt). |
| 4 | 162–171 | `CardTitle` avatar + infos : risque texte long. | Ajouter `min-w-0` sur le bloc texte, `truncate` sur l'email. |

### 2.13 SettingsPage — `client/src/pages/SettingsPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 35 | Déjà `flex-col sm:flex-row` sur le header. | RAS. |
| 2 | 50 | `p-6` fixe. | `p-4 sm:p-6`. |

### 2.14 Pages « placeholder » (Analytics, Portfolio, Prospects, Payments)
Fichiers :
- `client/src/pages/AnalyticsPage.tsx`
- `client/src/pages/PortfolioPage.tsx`
- `client/src/pages/ProspectsPage.tsx`
- `client/src/pages/PaymentsPage.tsx`

Mêmes patterns simples : header `px-6 py-4` + main `p-6` + un `flex justify-between` à un seul enfant.

Solution commune : `px-4 sm:px-6 py-3 sm:py-4`, `p-4 sm:p-6`, headers `flex-col gap-3 sm:flex-row sm:justify-between`.

---

## 3. Cards KPI & Stats

| Page | Lignes | Problème | Solution |
|------|--------|----------|----------|
| Dashboard | 187–253 | `text-2xl` valeur, `text-sm` titres, `gap-6` fixe. | Valeur : `text-2xl md:text-3xl lg:text-4xl`. Titres : `text-sm md:text-base`. `gap-4 sm:gap-6`. |
| TeamDashboard | 108–141 | Idem. | Idem. |
| ProjectsPage | 394–425 | Idem. | Idem. |
| TeamPage | 297–326 | Idem. | Idem. |

Règle générale : ajouter **`truncate`** sur les titres et **`break-words`** sur les descriptions.

---

## 4. Tableaux & listes (règle cards vs scroll horizontal)

### 4.1 Règle de décision

**Transformation en CARDS empilées** (cas par défaut, 90 % des cas) si :
- Le tableau a **plus de 3 colonnes**.
- Les lignes contiennent des **actions** (éditer / supprimer / menu kebab).
- L'utilisateur doit lire toutes les infos d'une ligne **d'un coup d'œil**.

**Scroll horizontal** (`overflow-x-auto`) si :
- 3–4 colonnes courtes et données numériques (stats compactes).
- Aspect facture/preview où l'agencement doit rester fidèle (ex. `QuotePreview`).
- Toujours accompagné d'un indicateur visuel (ombre dégradée à droite + texte discret « ← Glisser pour voir plus → » au premier rendu).

**Breakpoint** : transformation cards `<768 px` (sous `md:`), tableau classique `≥768 px`.
**Technique** : un seul composant gère les deux rendus via `hidden md:table-row-group` (rows desktop) et `md:hidden` (cards mobile).

### 4.2 Structure cible d'une card mobile

```
┌─────────────────────────────────┐
│ [Titre principal de la ligne]   │  text-base font-semibold
│ [Sous-titre / metadata]         │  text-xs text-zinc-400
│                                  │
│ Label 1 : Valeur 1               │  label = text-xs text-zinc-500 uppercase
│ Label 2 : Valeur 2               │  valeur = text-sm text-zinc-200
│ Label 3 : Valeur 3               │
│                                  │
│ [Badge status]    [Actions ⋮]   │
└─────────────────────────────────┘
```

Règles :
- `p-4` interne, `space-y-3` entre cards.
- `border border-zinc-800 rounded-xl` (à harmoniser avec le thème existant : `border-white/10 bg-black/20 backdrop-blur-md rounded-xl`).
- Le **fond noir/violet glassmorphism existant** est conservé — on n'introduit pas de nouvelle palette.
- Actions :
  - ≤ 2 actions → boutons visibles directement.
  - ≥ 3 actions → menu kebab `⋮` (`DropdownMenu`).

### 4.3 Tableaux concrets de l'app

| Fichier | Lignes | Colonnes | Verdict | Action |
|---------|--------|----------|---------|--------|
| `client/src/components/quotes/QuotePreview.tsx` | 87–119 | 5 (qté, désignation, unité, PU, total) | **Scroll horizontal** (preview facture) | Conserver `overflow-x-auto` + indicateur ombre + `text-[10px] sm:text-xs` sur `<th>/<td>`. |
| `client/src/pages/EstimationPage.tsx` | 926–952 | 4 (Poste / Quantité / PU HT / Total HT) | **Cards** (lignes avec sens métier, lecture d'ensemble) | `hidden md:table` + cards `md:hidden` empilées (titre = Poste, key/value pour Quantité/PU/Total). |
| `client/src/pages/PlanningPage.tsx` § « Chantiers du mois » | 683–736 | n/a (liste de lignes) | Déjà liste, juste rendre lignes mobile-friendly | `flex-col sm:flex-row` sur la métadata (cf. §2.5 #7). |
| `client/src/pages/QuotesPage.tsx` § Liste devis sauvegardés | 214–247 | n/a (liste) | Déjà liste, ajustements mineurs | `flex-col items-stretch sm:flex-row` + icône `h-11 w-11` (cf. §2.8 #3). |
| `client/src/pages/QuotesPage.tsx` § Lignes prestation | 706–781 | grille `lg:grid-cols-12` | Déjà responsive (empilage `<lg`) | Juste `min-h-11` sur supprimer ligne. |
| `client/src/pages/TeamPage.tsx` § Membres | 407–433 | liste flex | Déjà liste | `flex-col lg:flex-row` + `truncate` sur email (cf. §2.11 #3). |
| `client/src/components/ui/table.tsx` | 9–15 | composant générique | Neutre | Aucun changement. |

**Note importante** : l'app n'utilise **pas** de gros tableaux HTML pour Chantiers / Clients / Devis : ces données sont déjà rendues sous forme de **cards** dans des grilles `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. Donc l'effort principal porte sur **EstimationPage** (Step 3 résultats) et **QuotePreview**.

---

## 5. Formulaires & Modals

| Fichier | Lignes | Problème | Solution |
|---------|--------|----------|----------|
| `client/src/components/ui/dialog.tsx` | 41 | `DialogContent` : `max-w-lg` sans `max-h` ni `w-[calc(100vw-2rem)]` → débordement vertical possible (clavier iOS, contenu long) + bords collés sur très petit écran. | `w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg`. |
| `client/src/components/AccountDialog.tsx` | 74 | `max-w-md` sans `max-h`. | `max-h-[90vh] overflow-y-auto`. |
| Tous les `DialogContent` dans les pages | — | Hérite du `DialogContent` mais override ponctuel `max-w-2xl` souvent. | Ajouter localement `max-h-[85vh] overflow-y-auto` si formulaire long. |

---

## 6. UI de base — taille tactile

### `client/src/components/ui/button.tsx`
- **Lignes 28–32** : `default: min-h-9` (36), `sm: min-h-8` (32), `lg: min-h-10` (40), `icon: h-9 w-9` (36).
- **Solution** :
  ```ts
  default: "min-h-11 md:min-h-9 px-4 py-2",
  sm: "min-h-10 md:min-h-8 rounded-md px-3 text-xs",
  lg: "min-h-12 md:min-h-10 rounded-md px-8",
  icon: "h-11 w-11 md:h-9 md:w-9",
  ```
  → 44 px sur mobile/tablette, compact à partir de `md` (768).

### `client/src/components/ui/input.tsx`
- **Ligne 12** : `h-9` fixe. `text-base md:text-sm` déjà OK (évite zoom iOS).
- **Solution** : `h-11 md:h-9`.

### `client/src/components/ui/select.tsx`
- **Ligne 22** : `SelectTrigger h-9`.
- **Solution** : `h-11 md:h-9`.

### `client/src/components/ui/textarea.tsx`
- **Ligne 12** : `min-h-[80px]` + `text-base md:text-sm`. OK.

### `client/src/components/ui/card.tsx`
- **Lignes 38–41** : `CardTitle text-2xl` par défaut → titres disproportionnés sur mobile.
- **Solution** : laisser le défaut mais override sur chaque usage avec `text-lg sm:text-xl` ; OU modifier le composant en `text-xl sm:text-2xl`.

---

## 7. Calendrier (Planning)
Récap : voir §2.5. Décisions clés :
- Conserver la grille 7 colonnes (UX habituelle).
- Réduire taille cellules sur mobile : `min-h-[64px] sm:min-h-[120px]`, `p-1 sm:p-2`, `gap-1 sm:gap-2`, en-têtes jours `text-[10px] sm:text-sm`, numéros `text-xs sm:text-sm`.
- Toolbar : `flex flex-wrap gap-2`.

---

## 8. CRM Pipeline (kanban)
Voir §2.7. Déjà responsive. Aucune action obligatoire.

---

## 9. Landing (publique)

### 9.1 `client/src/pages/Home.tsx`
RAS direct — délègue à `HeroSection`.

### 9.2 `client/src/pages/LoginPage.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 100–115 | `h1 absolute` centré + bouton settings `h-8 w-8` → risque chevauchement texte/icône sur très petit écran. | `grid-cols-[auto_1fr_auto]` ou layout `flex` simple ; bouton `min-h-11 min-w-11`. |

### 9.3 `client/src/pages/AuthPage.tsx`
Champs et submit `h-12` → 48 px. **OK**.

### 9.4 `client/src/pages/InvitePage.tsx`
Inputs/boutons `h-12` pleine largeur. **OK**.

### 9.5 `client/src/components/Hero.tsx`
| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | 34 | `text-5xl md:text-7xl` peut être très grand sur 320 px. | `text-4xl sm:text-5xl md:text-7xl`. |
| 2 | 69 | Boutons `flex-row gap-3` sans wrap. | `flex flex-col sm:flex-row gap-3` + `w-full sm:w-auto`. |

### 9.6 `client/src/components/HeroSection.tsx`
Typo déjà responsive (`text-4xl sm:...`). CTA `px-6 py-4` correct. **OK**.

### 9.7 `client/src/components/FeaturesSection.tsx`
`md:grid-cols-2` OK ; sous-titre `text-xl` un peu gros. → `text-lg sm:text-xl`.

### 9.8 `client/src/components/ContactSection.tsx`
`md:grid-cols-2` formulaire OK.

### 9.9 `client/src/components/MetricCard.tsx`
`text-2xl` valeur sans `sm:`. → `text-xl sm:text-2xl`.

### 9.10 `client/src/components/ChartCard.tsx`
`ResponsiveContainer width="100%"` OK ; hauteur `200` fixe peut être courte avec beaucoup de labels mobile. → laisser tel quel pour l'instant ; ajouter `min-h-[200px]` sur le conteneur si besoin.

---

## 10. Récapitulatif des patterns à appliquer

| # | Pattern | Remplacement |
|---|---------|-------------|
| 1 | `ml-64` + `rounded-l-3xl` (PageWrapper, Dashboard, TeamDashboard) | `lg:ml-64 lg:rounded-l-3xl` + drawer mobile |
| 2 | Sidebar `fixed w-64` permanente | Drawer `translate-x-full lg:translate-x-0` + overlay `lg:hidden` |
| 3 | Headers `flex items-center justify-between` | `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` |
| 4 | Boutons `min-h-9` / `size="sm"` / `size="icon"` | `min-h-11 md:min-h-9` (default), `min-h-10 md:min-h-8` (sm), `h-11 w-11 md:h-9 md:w-9` (icon) |
| 5 | Inputs / Selects `h-9` | `h-11 md:h-9` |
| 6 | Grilles `grid-cols-N md:grid-cols-M` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N` pour KPI |
| 7 | Padding `p-6` / `px-6 py-4` | `p-4 sm:p-6` / `px-4 sm:px-6 py-3 sm:py-4` |
| 8 | Gap `gap-6` | `gap-3 sm:gap-6` (KPI) ou `gap-4 sm:gap-6` (sections) |
| 9 | Titres `text-2xl` fixes | `text-xl sm:text-2xl lg:text-3xl` |
| 10 | DialogContent sans max-h | `w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto` |
| 11 | Tables HTML (estimation, devis) | `hidden md:table` + cards `md:hidden` |
| 12 | Calendrier `grid-cols-7 min-h-[120px]` | Réduire `min-h`, `p`, `gap` et texte sous `sm` |

---

## 11. Toasts, dropdowns profil, breadcrumbs, loaders/skeletons

### 11.1 Toasts / notifications
**Fichiers** : `client/src/components/ui/toaster.tsx`, `client/src/components/ui/toast.tsx`, `client/src/hooks/use-toast.ts`. Utilisé dans `Dashboard.tsx`, `SettingsPage.tsx`, `App.tsx`.

| # | Lignes | Problème | Solution |
|---|--------|----------|----------|
| 1 | `toast.tsx` 17 | `ToastViewport` : `fixed top-0 w-full p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]` → déjà adaptatif (haut pleine largeur mobile, bas-droite desktop). Mais `p-4` reste fixe : trop loin du bord sur 320 px. | Garder le pattern, conserver `p-4` (cohérent). RAS critique. |
| 2 | `toast.tsx` 26 | `Toast` : `p-6 pr-8` → padding fixe imposant, prend trop de place mobile. | `p-4 pr-8 sm:p-6` (réduction `<sm`). |
| 3 | `toast.tsx` 71–86 | `ToastClose` : `p-1` autour d'un `X h-4 w-4` ≈ cible 24 px. | `p-2 sm:p-1` (touch target ≥ 32 px sur mobile, conserve desktop). |
| 4 | `toast.tsx` 56–69 | `ToastAction` : `h-8` (32 px). | `h-10 sm:h-8` ou `min-h-11 sm:min-h-8`. |
| 5 | `toast.tsx` 89 | `ToastTitle text-sm` / `ToastDescription text-sm` → OK, mais titre peut être tronqué : `<ToastTitle>` ne fait pas `break-words`. | Ajouter `break-words` sur titre + description. |

### 11.2 Dropdown profil / compte (top-right)
**Constat** : il n'y a **PAS de dropdown profil en haut à droite** dans l'app. L'accès au compte se fait via :
- Sidebar « Compte » (bas) → ouvre `AccountDialog` (modal).
- Le composant `client/src/components/ui/dropdown-menu.tsx` est défini (shadcn) mais **non utilisé** dans les pages métier.

**Action** :
- `AccountDialog.tsx` (déjà §5) : ajouter `max-h-[90vh] overflow-y-auto` ; sur mobile, l'avatar `h-20 w-20` reste OK ; pas d'autre action.
- Si tu veux ajouter un dropdown profil mobile (en haut à droite), me dire : ce serait un **ajout fonctionnel** (pas du responsive sur l'existant).

### 11.3 Breadcrumbs
**Constat** : le composant `client/src/components/ui/breadcrumb.tsx` existe (shadcn) mais **n'est utilisé dans aucune page**. Les pages utilisent `header > h1 + p` pour le contexte.

**Action** : aucun problème responsive à corriger. Si tu décides un jour d'ajouter des breadcrumbs, le composant shadcn est déjà responsive par défaut (wrap automatique).

### 11.4 Loaders / skeletons
**Constat** :
- `client/src/components/ui/skeleton.tsx` existe mais **non utilisé dans les pages métier**.
- Loaders observés :
  - `client/src/pages/InvitePage.tsx` lignes 88, 140 : `Loader2 animate-spin` (chargement invitation + vérification code).
  - `client/src/pages/AIVisualizationPage.tsx` ligne 252 : `RefreshCw animate-spin` (Step 3 « Génération »).
- `client/src/pages/TeamDashboard.tsx` ligne 65 : juste un texte « Chargement... » (pas de spinner).

| # | Fichier / Lignes | Problème | Solution |
|---|------------------|----------|----------|
| 1 | `InvitePage.tsx` 86–98 | Loader centré dans une Card avec `py-8` — pas de débordement. OK. | RAS. |
| 2 | `AIVisualizationPage.tsx` 246–270 | Card `text-center` + `Progress` `w-full` — déjà responsive. | RAS. |
| 3 | `TeamDashboard.tsx` 65 | Texte « Chargement... » sans skeleton ni spinner — pas un problème responsive, plus UX. | Hors scope du responsive (mais on peut ajouter un skeleton plus tard). |

**Action** : aucun changement responsive obligatoire sur les loaders existants. Les composants shadcn `Skeleton` + `Loader2 animate-spin` sont déjà responsives par défaut (le `Progress` notamment utilise `w-full`).

---

## 12. Plan d'implémentation (proposé, ordre d'attaque)

1. **Infrastructure**
   - Créer `client/src/stores/mobileNavStore.ts` (zustand).
   - Créer `client/src/components/MobileMenuButton.tsx`.
2. **Sidebars** : `Sidebar.tsx` + `TeamSidebar.tsx` en drawer mobile + overlay + auto-close au changement de route.
3. **Layout** : `PageWrapper.tsx`, `Dashboard.tsx`, `TeamDashboard.tsx` (ces deux derniers n'utilisent pas `PageWrapper`).
4. **UI de base** : `button.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx` (44 px tactile + dialog mobile-safe).
5. **Pages dashboard** (par ordre de priorité utilisateur) :
   - Dashboard, ProjectsPage, PlanningPage (calendrier).
   - EstimationPage (tableau → cards + ProgressSteps + drag&drop).
   - QuotesPage (lignes + preview).
   - TeamPage, ClientsPage, CRMPipelinePage.
   - AIVisualizationPage.
   - SettingsPage, et placeholders (Analytics/Portfolio/Prospects/Payments).
6. **Landing** : Hero, MetricCard, FeaturesSection, LoginPage (chevauchement bouton).
7. **Tests** : viewport 320 / 375 / 768 / 1024 / 1440 px.

---

_Audit produit le 14 mai 2026. Aucun code modifié à ce stade._
