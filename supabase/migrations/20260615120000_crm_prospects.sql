-- CRM Pipeline prospects (idempotent)
create table if not exists public.crm_prospects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  nom             text not null,
  entreprise      text not null default 'Particulier',
  email           text,
  telephone       text,
  type_travaux    text,
  montant_estime  numeric(14, 2) not null default 0,
  date_contact    date not null default current_date,
  colonne         text not null default 'Prospect'
    check (colonne in (
      'Prospect',
      'Visite chantier',
      'Devis envoyé',
      'Devis accepté',
      'En chantier',
      'Facturé'
    )),
  priorite        text not null default 'normale'
    check (priorite in ('haute', 'normale')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists crm_prospects_set_updated_at on public.crm_prospects;
create trigger crm_prospects_set_updated_at
  before update on public.crm_prospects
  for each row execute function public.set_updated_at();

create index if not exists idx_crm_prospects_user_id on public.crm_prospects(user_id);
create index if not exists idx_crm_prospects_colonne on public.crm_prospects(user_id, colonne);

alter table public.crm_prospects enable row level security;

drop policy if exists "crm_prospects_select_own" on public.crm_prospects;
create policy "crm_prospects_select_own"
  on public.crm_prospects for select
  using (auth.uid() = user_id);

drop policy if exists "crm_prospects_insert_own" on public.crm_prospects;
create policy "crm_prospects_insert_own"
  on public.crm_prospects for insert
  with check (auth.uid() = user_id);

drop policy if exists "crm_prospects_update_own" on public.crm_prospects;
create policy "crm_prospects_update_own"
  on public.crm_prospects for update
  using (auth.uid() = user_id);

drop policy if exists "crm_prospects_delete_own" on public.crm_prospects;
create policy "crm_prospects_delete_own"
  on public.crm_prospects for delete
  using (auth.uid() = user_id);
