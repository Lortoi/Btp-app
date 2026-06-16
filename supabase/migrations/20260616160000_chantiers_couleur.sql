-- Couleur d'affichage planning (barres calendrier)
alter table public.chantiers
  add column if not exists couleur text default '#f59e0b';
