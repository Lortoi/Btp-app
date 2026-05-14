# IMPORT_AUDIT.md — Audit préalable à la feature "Import factures PDF par IA"

> Checkpoint 0 du plan. Lecture du code existant, pas de modification.
> **STOP demandé après lecture pour validation avant Checkpoint 1.**

---

## 0. TL;DR — ce qu'il faut absolument savoir avant de coder

1. **Bombe en pleine face : les tables `clients`, `chantiers` et `devis` n'existent PAS dans Supabase.**
   - `clients` et `chantiers` vivent uniquement en mémoire React (`ChantiersContext`), perdus à chaque reload.
   - `devis` (quotes) vivent en `localStorage` du navigateur uniquement.
   - Le prompt d'origine suppose qu'on les a déjà en base avec un `siret` à ajouter → c'est faux. **Il faut d'abord créer ces tables avant de pouvoir importer dedans.**
2. **Deux bases de données coexistent et seule une est utilisée :**
   - `Supabase` (auth + team_members + admin_codes + team_invitations) → c'est la vraie base.
   - `Neon/Drizzle` (`server/db.ts` + `shared/schema.ts`) → présent mais quasi vide (juste une table `users` mock côté serveur, jamais branchée à l'UI).
   - Reco : tout passer par Supabase, le serveur Express est juste du Vite middleware en dev, il ne sert pas d'API métier.
3. **Aucun appel à une API externe d'IA n'existe aujourd'hui** dans le code de l'app (ni Claude, ni GPT, ni Mistral). `openai` est installé en dépendance mais jamais importé. À construire de zéro.
4. **Aucun stockage de fichiers côté serveur n'existe.** Logos = base64 dans localStorage. Photos chantiers = `URL.createObjectURL` (perdues au reload). Le bucket `factures-pdf` reste à créer.
5. **Travail responsive en cours non commité dans le working tree** (6 fichiers modifiés + 2 nouveaux). À traiter avant de démarrer la feature pour éviter le mélange (cf. §10).
6. **Pas de fichier `.env` dans le repo** — la `SUPABASE_URL` et la `SUPABASE_ANON_KEY` sont en dur dans `client/src/lib/supabaseClient.ts` avec fallback. Aucun emplacement actuel pour une `ANTHROPIC_API_KEY`.

Ces 6 points changent la séquence à suivre. Une proposition de plan révisé est en §11.

---

## 1. Tables Supabase qui existent vraiment

Détecté par scan de tous les `.from('...')` dans `client/src/**`.

| Table             | Source(s) du code                                               | Rôle                                                      |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| `user_profiles`   | `client/src/context/AuthContext.tsx` (insert au signup)         | Profil compagnon de `auth.users` (id, email, full_name).  |
| `team_members`    | `client/src/lib/supabase.ts` (fetch/create/update/delete/verify) | Membres de l'équipe d'un patron.                          |
| `admin_codes`     | `client/src/lib/supabase.ts`                                    | Code admin par user.                                      |
| `team_invitations`| `client/src/lib/supabase.ts`                                    | Tokens d'invitation membre d'équipe (7 jours).            |

**Schémas inférés depuis le code TS** (pas accès direct au SQL, juste les types) :

```ts
// client/src/lib/supabase.ts — interface TeamMember
{
  id: string;            // uuid
  name: string;
  role: string;
  email: string;
  phone: string | null;
  status: 'actif' | 'inactif';
  login_code: string;    // 6 chiffres
  user_id: string | null;// FK -> auth.users
  created_at: string;
  updated_at: string;
}

// AdminCode { id, code, user_id, created_at, updated_at }
// TeamInvitation { id, user_id, team_member_id, email, token, expires_at, used, created_at, updated_at }
// user_profiles { id, email, full_name } (inferred from AuthContext line 55-60)
```

**RLS** : non visible côté client mais le pattern `.eq('user_id', userId)` partout + le fait que toutes les queries passent par `getCurrentUserId()` indique des policies par `user_id` côté serveur. À confirmer dans la console Supabase. Pour les nouvelles tables on devra forcément ajouter les policies (cf. spec §2 du prompt origine, OK).

---

## 2. Tables / entités présupposées par le prompt mais ABSENTES de Supabase

Le prompt d'origine demande :

> "Adapte les noms de tables `clients` et `chantiers` si tes tables actuelles ont d'autres noms. Vérifie aussi que la colonne `siret` existe dans `clients`, sinon ajoute-la."

État réel :

### 2.1 `clients` — n'existe PAS en base
Source de vérité actuelle : `client/src/context/ChantiersContext.tsx`

```ts
// client/src/context/ChantiersContext.tsx (lignes 3-8)
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}
```

- État stocké via `useState` (in-memory). 2 clients mockés en dur (Jean Dupont, Marie Martin).
- Pas de `siret`, pas d'`adresse`, pas de `code_postal`, pas de `ville`.
- Page d'usage : `client/src/pages/ClientsPage.tsx` → ajout via `useChantiers().addClient(...)` (toujours en mémoire).
- Aucune query Supabase ne touche une table `clients`.

### 2.2 `chantiers` — n'existe PAS en base
Source de vérité actuelle : même fichier, même contexte.

```ts
// client/src/context/ChantiersContext.tsx (lignes 10-19)
export interface Chantier {
  id: string;
  nom: string;
  clientId: string;
  clientName: string;
  dateDebut: string;
  duree: string;
  images: string[];
  statut: 'planifié' | 'en cours' | 'terminé';
}
```

- État en mémoire React. Démarre vide (`useState<Chantier[]>([])`).
- Page `ProjectsPage.tsx` affiche en plus des `mockChantiers` codés en dur dans le fichier (cf. lignes 42-...). Mock distinct de ce que `ChantiersContext` peut contenir.
- Aucune query Supabase n'existe.

### 2.3 `devis` — n'existe PAS en base
Source de vérité actuelle : `client/src/components/quotes/quoteTypes.ts`

```ts
export const QUOTE_STORAGE_KEY = "planchais.quoteDraft.v1"          // draft en cours
export const QUOTE_SEQ_KEY = "planchais.quoteSeq.v1"                 // séquence par mois
export const SAVED_QUOTES_KEY = "planchais.quotes.v1"                // liste des devis sauvegardés
export const SAVED_QUOTES_SELECTED_ID_KEY = "planchais.quotes.selectedId"
```

- 100 % `localStorage`. Un autre navigateur = aucun devis.
- `nextQuoteNumber()` génère `DEV-YYYYMM-XXX` localement.

### 2.4 Conséquence directe pour la feature
On ne peut pas juste « importer des factures rattachées à un client existant » parce qu'il n'y a pas de notion persistante de client/chantier multi-device. Trois options à trancher avec toi (§12, question Q1) :

- **A. Créer dès maintenant les tables `clients`, `chantiers`, `devis` en plus des tables d'import**, et migrer `ChantiersContext`/`localStorage` vers Supabase. C'est lourd mais c'est ce que le prompt original suppose implicitement. Sans ça, importer 200 factures qui créent 47 clients en mémoire = aucun intérêt, ça disparaît au prochain reload.
- **B. Créer uniquement les tables `imports`, `factures`, `factures_lignes` + une table `clients_imported` autonome**, et plus tard quand on fera la persistance "vraie" des clients/chantiers, on fera la migration. Repousse le problème.
- **C. Approche hybride** : créer `clients` et `chantiers` en Supabase MAINTENANT mais sans toucher au code existant (`ChantiersContext` continue à fonctionner en parallèle). Au moment de l'import, on écrit directement en Supabase. Risque : double source de vérité tant qu'on n'a pas migré ChantiersContext.

Ma reco : **option A**, parce que sinon le « CA reconstitué : 312 450 € » de l'écran récap (§9 du prompt) n'a aucune valeur réelle si tout s'évapore. Mais ça remonte le scope du MVP. À toi.

---

## 3. Menu Paramètres — où brancher l'import ?

### 3.1 Route et page actuelles
- Route : `/dashboard/settings` (déclarée dans `client/src/App.tsx` ligne 107-108).
- Component : `client/src/pages/SettingsPage.tsx`.

### 3.2 Structure de la page
4 cartes Shadcn (Card + CardHeader + CardContent), aucune navigation interne, tout est un long scroll :

1. **Compte** — nomAffiche, telephoneContact (persistés `localStorage` via `settingsStorage.ts`).
2. **Notifications** — switches notifChantiers/notifDevis.
3. **Apparence** — réduire les animations.
4. **Confidentialité** — switch stats anonymes.

### 3.3 Comment brancher "Importer mes données"
Trois options :

- **A. Carte supplémentaire dans `SettingsPage.tsx`** avec un bouton "Importer mes données" → redirige vers `/dashboard/settings/import` (nouvelle route). Plus simple, cohérent avec le reste.
- **B. Section onglets / sidebar interne dans Settings** (refacto profond, je le déconseille — règle additive de ton dernier message).
- **C. Item de menu dédié dans la `Sidebar` principale** (style "Onboarding") au lieu de passer par Settings. Ça matche la mention « première chose qu'utilise un patron BTP quand il se connecte ».

Ma reco : **A + un point d'entrée mis en avant sur le Dashboard quand `factures.count == 0`** (carte d'onboarding visible mais pas bloquante). Question Q2 en §12.

### 3.4 Sidebar — état actuel
`client/src/components/Sidebar.tsx` — liste fixe (cf. lignes 48-58), pas de menu dynamique. Si on choisit l'option C il faut ajouter un item. L'item "Settings" est absent de la sidebar actuelle (étrange mais c'est l'état), seul accès actuel = direct URL ou bouton "Compte" en bas qui ouvre `AccountDialog`, pas la page Settings.

> Note : il y a aussi `TeamSidebar.tsx` pour le mode "membre d'équipe". Un patron BTP est en mode admin (Sidebar standard). L'import ne doit PAS être visible côté équipe.

---

## 4. Authentification & récupération du `user_id`

### 4.1 Provider central
`client/src/context/AuthContext.tsx`

- Wrappe l'app dans `App.tsx` (`<AuthProvider>`). Expose `user`, `session`, `loading`, `signUp`, `signIn`, `signOut`.
- `user.id` = UUID Supabase (`auth.users.id`).
- Hook d'usage : `const { user } = useAuth()`.

### 4.2 Helper côté lib
`client/src/lib/supabase.ts` ligne 7-11 :

```ts
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}
```

C'est le pattern existant et il est OK. À réutiliser pour les nouvelles fonctions `lib/imports.ts` etc.

### 4.3 Protection des routes
`client/src/components/ProtectedRoute.tsx` :
- Si pas de `user` et pas de `sessionStorage.authBypass === 'true'`, redirige vers `/auth`.
- Toutes les routes `/dashboard/*` (sauf `/team-dashboard`) sont enveloppées dans `ProtectedRoute`.
- **Attention** : il existe un mode "authBypass" via `sessionStorage` pour les membres d'équipe (cf. flow team_invitations + verifyTeamMemberCode). Les écrans d'import doivent **refuser** ce bypass car ils écrivent en Supabase avec `auth.uid()` → un team_member sans session auth n'aura pas de `user_id` valide.

### 4.4 Double identité possible
Le mode "équipe" stocke dans `localStorage` (`userType`, `teamMember`) en plus de la session Supabase. Pour l'import, il faudra checker `userType !== 'team'` ou simplement utiliser strict `useAuth().user` (les membres d'équipe ne sont pas censés importer des factures du patron).

---

## 5. API externes — code existant à réutiliser

### 5.1 Côté frontend
Recherché : `openai`, `gpt`, `anthropic`, `claude`. Résultat : **0 import, 0 appel** dans `client/src`. Pure dépendance dans `package.json`.

```json
// package.json ligne 66
"openai": "^5.20.1"
```

### 5.2 Côté serveur (`server/`)
`server/routes.ts` :

```ts
export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  const httpServer = createServer(app);
  return httpServer;
}
```

**Zéro route.** Le serveur Express ne sert que de host pour Vite en dev et de static server en prod. Il n'expose AUCUNE API métier.

### 5.3 Conclusion
Il n'y a pas de "client API" existant à étendre. On démarre vierge. Pour cette feature on a deux chemins :

- **Edge Function Supabase (`/functions/analyze-invoice`)** — ce que le prompt demande. Avantage : `ANTHROPIC_API_KEY` reste côté serveur, RGPD friendly, scalable. Nécessite que tu actives Supabase Edge Functions et que tu déploies via `supabase functions deploy`.
- **Endpoint Express dans `server/routes.ts`** — plus simple à déboguer en local, mais ça oblige à héberger le serveur Express en prod (aujourd'hui le build sort un `dist/index.js` lancé par `npm start`, mais pas sûr que ce soit déployé quelque part — `replit.md` mentionne autoscale Replit).

Ma reco : **Edge Function** conforme au prompt. À confirmer (question Q3).

---

## 6. Stockage de fichiers — quel système existant ?

### 6.1 Logos d'entreprise (Devis)
`QuotesPage.tsx` ligne 131-145 : `FileReader.readAsDataURL` → base64 dans le draft → `localStorage` (clé `planchais.quoteDraft.v1`). Limite pratique : ~5 MB par devis tout compris.

### 6.2 Photos de chantiers
`ProjectsPage.tsx` (cf. `chantier.images: string[]`) : URLs créées via `URL.createObjectURL` côté client, **non persistées**. Les images disparaissent au reload.

### 6.3 Photos d'estimation (`EstimationPage`)
Idem, base64 ou ObjectURL, jamais uploadées.

### 6.4 Bucket Supabase Storage
**Aucun bucket configuré côté code.** Aucun `supabase.storage.from(...)` dans tout `client/src`. À créer (bucket `factures-pdf` mentionné dans le prompt, OK).

### 6.5 Conséquences pour l'import
- Le pattern "upload PDF → URL Supabase" sera la **première vraie** intégration Storage de l'app. Donc on partira d'un template propre (helper dans `lib/storage.ts`).
- Aucune dette technique à reprendre, c'est plutôt une bonne nouvelle.
- Côté policies Storage : il faut un bucket privé avec policy `auth.uid() = owner` pour SELECT/INSERT/DELETE, et accès via URLs signées (signedUrl, durée courte) pour le PDF Preview.

---

## 7. Base Postgres "Neon" via Drizzle — à ignorer ou pas ?

Le repo a deux DB connectées :

### 7.1 Supabase (utilisée)
- `client/src/lib/supabaseClient.ts` : `createClient(SUPABASE_URL, ANON_KEY)`.
- Tables réelles : §1.

### 7.2 Neon + Drizzle (présente, quasi-inutilisée)
- `server/db.ts` : `Pool` Neon, `drizzle({ client: pool, schema })`.
- `shared/schema.ts` : une seule table `users` (id, username, password).
- `server/storage.ts` : utilise `MemStorage` in-memory même pas Drizzle.
- `drizzle.config.ts` : pointe vers `./migrations` (dossier inexistant).
- `package.json` script `db:push` : `drizzle-kit push`.
- `DATABASE_URL` requis sinon `server/db.ts` throw. Donc en dev Replit cette var est probablement settée.

**Ma reco : on ignore Neon/Drizzle pour la feature import.** On reste sur Supabase, en cohérence avec le reste du code applicatif. Les migrations seront posées via SQL Supabase (dashboard ou CLI), pas via Drizzle.

> Si un jour tu veux unifier, c'est une autre tâche.

---

## 8. Stack & libs déjà présentes utiles à la feature

| Besoin                          | Lib présente               | Action                                                          |
| ------------------------------- | -------------------------- | --------------------------------------------------------------- |
| Validation schéma IA            | `zod` ^3.24.2              | OK, on l'utilise tel quel.                                       |
| Forms                           | `react-hook-form` + zod    | OK pour l'écran validation.                                     |
| Toasts                          | `useToast()` (`hooks/use-toast`) | OK, déjà en place.                                         |
| Modales                         | `@/components/ui/dialog`   | OK (Radix Dialog).                                              |
| Tabs (3 onglets validation)     | `@/components/ui/tabs` (Radix) | OK.                                                          |
| Loader / progress               | `@/components/ui/progress` (Radix) | OK.                                                       |
| State global                    | `zustand` ^5.0.12          | OK pour `useImportSession`.                                     |
| Server state / cache            | `@tanstack/react-query`    | OK pour les fetch des imports / factures.                       |
| Drag & drop                     | **MANQUE** `react-dropzone`| À ajouter.                                                      |
| Fuzzy match                     | **MANQUE** `string-similarity` ou `fuse.js` | À ajouter.                                |
| PDF preview                     | `@react-pdf/renderer` (génère) | **NE FAIT PAS DE PREVIEW**. Pour rendre un PDF uploadé en aperçu il faut `react-pdf` ou `pdfjs-dist`. À ajouter. |

Estimations grossières des nouvelles deps : `react-dropzone` (~13 KB gzip), `pdfjs-dist` (~600 KB worker — gros, à charger en lazy via `lazy()` + suspense), `string-similarity` (<5 KB).

---

## 9. Routes existantes pertinentes

Toutes déclarées dans `client/src/App.tsx` (switch sur `useLocation`) :

- `/`, `/auth`, `/login` → pages publiques
- `/invite/:token` → invitation membre équipe
- `/team-dashboard` → mode membre équipe
- `/dashboard` (+ enfants) → mode admin (patron BTP), wrappé `ProtectedRoute`
  - `estimation`, `quotes`, `ai-visualization`, `prospects`, `projects`, `clients`, `planning`, `crm`, `team`, `settings`

Pour l'import, nouvelles routes proposées (à valider Q4) :

- `/dashboard/settings/import` — choix de méthode + historique imports
- `/dashboard/settings/import/factures` — wizard 4 étapes (upload → analyse → validation → récap)

Alternative : un seul `ImportPage` avec wizard interne et state Zustand. Plus simple à débugger.

---

## 10. État du working tree — IMPORTANT

`git status` au moment de l'audit :

```
On branch main
Your branch is ahead of 'origin/main' by 1 commit.

Changes not staged for commit:
  modified:   client/src/App.tsx
  modified:   client/src/components/PageWrapper.tsx
  modified:   client/src/components/Sidebar.tsx
  modified:   client/src/components/TeamSidebar.tsx
  modified:   client/src/pages/Dashboard.tsx
  modified:   client/src/pages/TeamDashboard.tsx

Untracked files:
  client/src/components/MobileMenuButton.tsx
  client/src/stores/mobileNavStore.ts
```

Ce sont des **changements responsive partiels** (drawer mobile + bouton hamburger + store Zustand de la nav mobile) que j'avais commencés et qui ne sont pas pushés. Le HEAD remote `04afdcc` ne contient AUCUN responsive ; le HEAD local `3deab94` contient juste l'audit responsive (RESPONSIVE_AUDIT.md).

Trois options avant de commencer le Checkpoint 1 (question Q5) :

- **A. Commit ces changements comme `feat(responsive): sidebar drawer mobile + top bar`** puis enchaîner sur l'import. Risque : on commit du responsive partiel (Sidebar fonctionne, mais les pages internes ne sont pas adaptées).
- **B. Stash** ces changements pour pivoter 100 % sur l'import, on les reprendra après.
- **C. Discarder** ces changements (perte totale) — fortement déconseillé après le boulot fait.

Ma reco : **A**, parce que le responsive de la Sidebar est cohérent (drawer + hamburger + store), c'est un découpage logique. Le reste du responsive (cards, tables, breakpoints des pages) sera repris plus tard.

---

## 11. Plan révisé proposé pour les checkpoints suivants

Ton plan d'origine (Checkpoints 1-5) reste valide mais doit absorber les surprises de §2. Voilà comment je propose de le moduler — toujours avec stop à chaque checkpoint :

### Checkpoint 1 — Migrations Supabase + bucket  (élargi)
Si tu choisis l'option A de §2.4, ce checkpoint devient :

1. SQL : créer `clients` (id, user_id, nom, adresse, code_postal, ville, telephone, email, siret, created_at, updated_at).
2. SQL : créer `chantiers` (id, user_id, client_id, nom, adresse, code_postal, ville, description, date_debut, date_fin, statut, created_at).
3. SQL : créer `imports`, `factures`, `factures_lignes` (conforme au prompt).
4. SQL : indexes (idx_clients_siret WHERE siret IS NOT NULL, idx_clients_user_nom, idx_factures_user_import, idx_chantiers_user_client).
5. SQL : RLS policies (`auth.uid() = user_id`) sur les 5 tables.
6. Bucket Supabase Storage `factures-pdf` privé, policies par `auth.uid()`.
7. Coté code, **aucun** changement applicatif tant que ces tables ne sont pas utilisées. On reste additif.

Délivrable : un fichier `supabase/migrations/20260514_import_feature.sql` et un script à exécuter dans le SQL Editor Supabase, plus un screenshot de la console Supabase pour valider le bucket.

> Note : si tu préfères l'option B (factures isolées), on garde uniquement les étapes 3-7 + un `clients_imported` autonome au lieu de réutiliser `clients`.

### Checkpoint 2 — Edge Function `analyze-invoice`
Conforme au prompt. Hypothèse : Supabase CLI installée localement, projet linké. À confirmer (Q3).
- Implémentation TS dans `supabase/functions/analyze-invoice/index.ts`.
- Secrets : `ANTHROPIC_API_KEY` via `supabase secrets set`.
- Test avec une facture exemple en local via `supabase functions serve`.

### Checkpoint 3 — Écrans upload + analyse
- `/dashboard/settings/import` (entrée + historique).
- `/dashboard/settings/import/factures` (wizard upload + analyse).
- Hook `useImportSession` Zustand. Hook `useInvoiceAnalysis` qui appelle l'edge function (3 calls en parallèle max).

### Checkpoint 4 — Écran validation
Le plus critique. Cards + tabs + PDF preview + edit fields + duplicate matching.

### Checkpoint 5 — Import final + undo 24h
- Transaction Supabase pour insert atomique.
- Undo via `imports.status = 'cancelled'` + cascade delete (on supprime les rows avec `import_id` correspondant).

---

## 12. Questions bloquantes avant Checkpoint 1

À me répondre avant que je touche au moindre fichier de code applicatif. Ce sont des choix structurants.

- **Q1 — Tables clients/chantiers : option A, B ou C de §2.4 ?**
  Ma reco : **A** (créer clients + chantiers + factures en Supabase maintenant, on migrera `ChantiersContext` côté UI plus tard, mais l'import écrit directement en base).
- **Q2 — Point d'entrée de l'import : §3.3 option A, B ou C ?**
  Ma reco : **A** (carte dans SettingsPage + onboarding card sur le Dashboard quand 0 facture).
- **Q3 — Edge Function ou route Express ? §5.3.**
  Ma reco : **Edge Function** (conforme au prompt + RGPD).
  Sous-question : tu as la Supabase CLI installée localement, et le projet est linké via `supabase link --project-ref hvnjlxxcxfxvuwlmnwtw` ?
- **Q4 — URL structure : route unique ou wizard ? §9.**
  Ma reco : **2 routes** (`/import` index + `/import/factures` wizard).
- **Q5 — Working tree responsive : §10.**
  Ma reco : **commit A** ("feat(responsive): sidebar drawer mobile + top bar") avant de démarrer le Checkpoint 1.
- **Q6 — Région Supabase EU pour RGPD.**
  L'URL est `hvnjlxxcxfxvuwlmnwtw.supabase.co`. Je ne peux pas la déduire du nom seul. Peux-tu confirmer dans Settings → General → Region dans la console Supabase que le projet est bien sur une région EU (Paris/Frankfurt) ? Si non, il y a un sujet RGPD à régler avant de stocker des factures clients dedans.
- **Q7 — Zero data retention Anthropic.**
  Anthropic propose le ZDR sur les comptes Business/Enterprise (pas par défaut sur le tier dev/standard). Tu confirmes que tu activeras le ZDR avant la mise en prod, ou bien on accepte un retention de 30 jours côté Anthropic pour le MVP ?
- **Q8 — Limite tarif API**
  Le prompt mentionne ~0,02-0,05 € / facture. Veux-tu un **hard cap** par batch (ex : refus si > 50 € estimés) ou juste un warning ? Je propose un warning à 20 € + hard cap à 100 € par batch.
- **Q9 — `RESPONSIVE_AUDIT.md` à la racine — on le garde, on le déplace, on le supprime ?**
  Suggestion : le déplacer dans `docs/audits/` ou le renommer `AUDIT_RESPONSIVE.md` pour qu'il ne se mélange pas avec `IMPORT_AUDIT.md`. Cosmétique.

---

## 13. Risques que j'ai identifiés en plus du prompt

- **Risque R1 — Le patron a déjà des clients en `ChantiersContext` (entrés manuellement dans la session)**, lance un import, l'import crée 47 clients en Supabase, mais le `ClientsPage` continue à lire `ChantiersContext` → il ne voit rien. **Mitigation : Checkpoint 6 obligatoire qui migre `ClientsPage`/`ProjectsPage` pour lire Supabase.** Sinon l'utilisateur a l'impression que l'import a échoué.
- **Risque R2 — Bypass auth pour membres d'équipe.**
  Si on n'isole pas, un team_member pourrait potentiellement déclencher un import "au nom de" l'admin → corruption de données. Mitigation : guard explicite sur l'URL et sur les fonctions `useImport*`.
- **Risque R3 — PDF malveillant / overflow JSON Anthropic.**
  Un PDF de 10 MB avec contenu très long pourrait faire dépasser les 4096 tokens. Mitigation : prompt qui dit "si plus de 20 lignes de prestations, mets `remarques: 'facture très longue — vérifier manuellement'`" + max_tokens 8192 plutôt que 4096.
- **Risque R4 — Coût Edge Function Supabase.**
  Free tier = 500K invocations/mois. Pour 1 patron qui importe 200 factures, ça consomme 200 invocations (rien). Mais avec 100 patrons importateurs en simultané sur l'onboarding, on consomme plus. **Pas bloquant pour le MVP**, à monitorer.
- **Risque R5 — Anthropic timeout > 60s Edge Function.**
  Les Edge Functions Supabase ont un timeout par défaut de 60s (peut monter à 150s sur plan payant). Une analyse PDF Claude Sonnet 4.5 sur un PDF de 10 pages prend 5-15s en pratique → on est large, mais il faut un timeout côté code pour gracefully fail.
- **Risque R6 — Le model name `claude-sonnet-4-5` n'est peut-être pas le nom exact actuel.**
  Au Checkpoint 2, je vais vérifier le nom de modèle valide via la doc Anthropic publique au moment du dev. Pas un blocage maintenant.

---

## 14. Définition de "fait" pour ce checkpoint 0

- [x] Tables Supabase réellement utilisées listées avec leurs champs (§1)
- [x] Tables présupposées par le prompt confirmées comme **absentes** (§2)
- [x] Emplacement Paramètres + options de branchement de l'import (§3)
- [x] Mécanisme d'authentification et récupération `user_id` documenté (§4)
- [x] Inventaire des APIs externes existantes (réponse : aucune) (§5)
- [x] Inventaire du stockage de fichiers existant (réponse : aucun durable) (§6)
- [x] État du working tree clarifié (§10)
- [x] Liste de questions bloquantes posée (§12)

**Stop. J'attends ta validation de cet audit + tes réponses aux questions Q1-Q9 avant d'attaquer le Checkpoint 1 (migrations Supabase).**
