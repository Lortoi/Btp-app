-- Extension user_profiles : informations entreprise + plan
alter table if exists public.user_profiles
  add column if not exists nom_entreprise text,
  add column if not exists logo_base64 text,
  add column if not exists adresse text,
  add column if not exists siret text,
  add column if not exists telephone text,
  add column if not exists tva_intracom text,
  add column if not exists plan text default 'pro',
  add column if not exists plan_renewal_date date;
