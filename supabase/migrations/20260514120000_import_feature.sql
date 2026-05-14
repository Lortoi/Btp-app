-- =============================================================================
-- Migration : Import factures PDF par IA
-- Date      : 2026-05-14
-- Auteur    : Cursor / Checkpoint 1
-- Idempotent: oui (à exécuter une seule fois mais sûr à rejouer)
--
-- Crée les tables persistantes nécessaires à la feature d'import :
--   - clients          (jusqu'ici en mémoire React, désormais persistant)
--   - chantiers        (idem)
--   - imports          (traçabilité des sessions d'import)
--   - factures         (factures importées via PDF + IA)
--   - factures_lignes  (lignes de prestations d'une facture)
--
-- Ainsi que le bucket Storage `factures-pdf` et toutes les policies RLS.
--
-- IMPORTANT : Cette migration ne touche PAS aux tables existantes
-- (user_profiles, team_members, admin_codes, team_invitations). Approche additive.
--
-- À exécuter dans le SQL Editor du dashboard Supabase, projet EU.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;


-- -----------------------------------------------------------------------------
-- 1. Helper : trigger pour updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =============================================================================
-- TABLE : imports
-- Suit chaque session d'import (1 batch de PDFs = 1 ligne).
-- Sert d'ancre pour l'undo 24h et le tracking de coût IA.
-- =============================================================================
create table if not exists public.imports (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  type                        text not null check (type in ('factures_pdf', 'csv', 'manuel')),
  status                      text not null default 'pending'
                                check (status in ('pending', 'analyzing', 'awaiting_validation',
                                                  'completed', 'cancelled', 'failed')),

  -- Compteurs (mis à jour au fil de l'eau)
  total_files                 int  not null default 0,
  total_processed             int  not null default 0,
  total_clients_created       int  not null default 0,
  total_chantiers_created     int  not null default 0,
  total_factures_imported     int  not null default 0,
  total_ca_reconstitue        numeric(14, 2) not null default 0,

  -- Coût API (Anthropic) cumulé sur l'ensemble du batch
  cost_eur                    numeric(10, 4) not null default 0,

  -- Métadonnées
  notes                       text,
  error_message               text,

  -- Timestamps
  created_at                  timestamptz not null default now(),
  validated_at                timestamptz,
  completed_at                timestamptz,
  updated_at                  timestamptz not null default now()
);

drop trigger if exists imports_set_updated_at on public.imports;
create trigger imports_set_updated_at
  before update on public.imports
  for each row execute function public.set_updated_at();

create index if not exists idx_imports_user_id  on public.imports(user_id);
create index if not exists idx_imports_status   on public.imports(status);


-- =============================================================================
-- TABLE : clients
-- Source de vérité persistante des clients du patron BTP.
-- (Remplace `ChantiersContext.tsx` côté React — la migration UI viendra plus tard.)
-- =============================================================================
create table if not exists public.clients (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,

  -- Identité
  nom                         text not null,
  email                       text,
  telephone                   text,

  -- Adresse
  adresse                     text,
  code_postal                 text,
  ville                       text,

  -- Identifiants légaux
  siret                       text,           -- 14 chiffres si renseigné (validé côté app)
  tva_intracom                text,

  -- Provenance : si non-null, ce client a été créé par cet import (utile pour l'undo)
  created_by_import_id        uuid references public.imports(id) on delete set null,

  -- Timestamps
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create index if not exists idx_clients_user_id   on public.clients(user_id);
create index if not exists idx_clients_siret     on public.clients(siret) where siret is not null;
create index if not exists idx_clients_user_nom  on public.clients(user_id, nom);
create index if not exists idx_clients_import    on public.clients(created_by_import_id) where created_by_import_id is not null;


-- =============================================================================
-- TABLE : chantiers
-- Idem clients — passe en persistant.
-- =============================================================================
create table if not exists public.chantiers (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  client_id                   uuid references public.clients(id) on delete set null,

  -- Description
  nom                         text not null,
  description                 text,

  -- Adresse du chantier (peut différer de l'adresse du client)
  adresse                     text,
  code_postal                 text,
  ville                       text,

  -- Planning
  date_debut                  date,
  date_fin                    date,
  statut                      text default 'planifie'
                                check (statut in ('planifie', 'en_cours', 'termine', 'archive')),

  -- Provenance : si non-null, ce chantier a été créé par cet import (utile pour l'undo)
  created_by_import_id        uuid references public.imports(id) on delete set null,

  -- Timestamps
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

drop trigger if exists chantiers_set_updated_at on public.chantiers;
create trigger chantiers_set_updated_at
  before update on public.chantiers
  for each row execute function public.set_updated_at();

create index if not exists idx_chantiers_user_id     on public.chantiers(user_id);
create index if not exists idx_chantiers_client_id   on public.chantiers(client_id);
create index if not exists idx_chantiers_user_client on public.chantiers(user_id, client_id);
create index if not exists idx_chantiers_import      on public.chantiers(created_by_import_id) where created_by_import_id is not null;


-- =============================================================================
-- TABLE : factures
-- Une ligne par facture importée. Lien optionnel vers client & chantier.
-- =============================================================================
create table if not exists public.factures (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  import_id                   uuid references public.imports(id) on delete cascade,
  client_id                   uuid references public.clients(id) on delete set null,
  chantier_id                 uuid references public.chantiers(id) on delete set null,

  -- Identification facture
  numero                      text,
  date_emission               date,
  date_prestation             date,

  -- Montants
  montant_ht                  numeric(14, 2),
  montant_tva                 numeric(14, 2),
  montant_ttc                 numeric(14, 2),

  -- Source / extraction
  pdf_url                     text,           -- chemin dans le bucket factures-pdf
  pdf_filename                text,           -- nom d'origine du fichier
  raw_extraction              jsonb,          -- JSON brut retourné par Claude
  confidence_score            numeric(3, 2),  -- 0.00 à 1.00
  champs_incertains           text[],         -- liste des chemins JSON incertains
  api_cost_eur                numeric(10, 4) not null default 0,
  api_model                   text,           -- ex. 'claude-sonnet-4-5'

  -- Statut workflow
  status                      text not null default 'extracted'
                                check (status in ('extracted', 'validated', 'imported',
                                                  'ignored', 'error')),
  notes                       text,
  error_message               text,

  -- Timestamps
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

drop trigger if exists factures_set_updated_at on public.factures;
create trigger factures_set_updated_at
  before update on public.factures
  for each row execute function public.set_updated_at();

create index if not exists idx_factures_user_id       on public.factures(user_id);
create index if not exists idx_factures_import_id     on public.factures(import_id);
create index if not exists idx_factures_client_id     on public.factures(client_id);
create index if not exists idx_factures_chantier_id   on public.factures(chantier_id);
create index if not exists idx_factures_user_status   on public.factures(user_id, status);
create index if not exists idx_factures_user_emission on public.factures(user_id, date_emission desc);


-- =============================================================================
-- TABLE : factures_lignes
-- Lignes de prestations d'une facture (cascade delete si la facture est supprimée).
-- =============================================================================
create table if not exists public.factures_lignes (
  id                          uuid primary key default gen_random_uuid(),
  facture_id                  uuid not null references public.factures(id) on delete cascade,

  designation                 text,
  quantite                    numeric(12, 3),
  prix_unitaire               numeric(12, 4),
  montant_ht                  numeric(14, 2),
  tva_rate                    numeric(5, 2),

  ordre                       int not null default 0,
  created_at                  timestamptz not null default now()
);

create index if not exists idx_factures_lignes_facture on public.factures_lignes(facture_id);


-- =============================================================================
-- RLS : tout est privé par user_id.
-- =============================================================================
alter table public.imports          enable row level security;
alter table public.clients          enable row level security;
alter table public.chantiers        enable row level security;
alter table public.factures         enable row level security;
alter table public.factures_lignes  enable row level security;

-- imports
drop policy if exists "users_own_imports" on public.imports;
create policy "users_own_imports" on public.imports
  for all
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- clients
drop policy if exists "users_own_clients" on public.clients;
create policy "users_own_clients" on public.clients
  for all
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- chantiers
drop policy if exists "users_own_chantiers" on public.chantiers;
create policy "users_own_chantiers" on public.chantiers
  for all
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- factures
drop policy if exists "users_own_factures" on public.factures;
create policy "users_own_factures" on public.factures
  for all
  using       (auth.uid() = user_id)
  with check  (auth.uid() = user_id);

-- factures_lignes : accès via la facture parente
drop policy if exists "users_own_factures_lignes" on public.factures_lignes;
create policy "users_own_factures_lignes" on public.factures_lignes
  for all
  using (
    exists (
      select 1 from public.factures f
      where f.id = factures_lignes.facture_id
        and f.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.factures f
      where f.id = factures_lignes.facture_id
        and f.user_id = auth.uid()
    )
  );


-- =============================================================================
-- STORAGE : bucket privé `factures-pdf`
-- Convention de path : <user_id>/<import_id>/<facture_id>.pdf
-- Policy : un user n'accède qu'aux fichiers dont le 1er segment du path == son uid.
-- =============================================================================

-- Bucket (privé, max 10MB par fichier, MIME application/pdf uniquement)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'factures-pdf',
  'factures-pdf',
  false,
  10485760,                          -- 10 MB
  array['application/pdf']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policies storage.objects pour le bucket factures-pdf
drop policy if exists "factures_pdf_select_own" on storage.objects;
create policy "factures_pdf_select_own" on storage.objects
  for select
  using (
    bucket_id = 'factures-pdf'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "factures_pdf_insert_own" on storage.objects;
create policy "factures_pdf_insert_own" on storage.objects
  for insert
  with check (
    bucket_id = 'factures-pdf'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "factures_pdf_update_own" on storage.objects;
create policy "factures_pdf_update_own" on storage.objects
  for update
  using (
    bucket_id = 'factures-pdf'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "factures_pdf_delete_own" on storage.objects;
create policy "factures_pdf_delete_own" on storage.objects
  for delete
  using (
    bucket_id = 'factures-pdf'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- =============================================================================
-- FIN DE MIGRATION
-- Vérifier après exécution :
--   select table_name from information_schema.tables
--   where table_schema = 'public'
--     and table_name in ('imports','clients','chantiers','factures','factures_lignes');
--
--   select id, name, public, file_size_limit, allowed_mime_types
--   from storage.buckets where id = 'factures-pdf';
-- =============================================================================
