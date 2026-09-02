-- Entrada inteligente de produtos (IA) + auto-distribuição no corpo do tabloide.
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new

alter table public.tabloid_products
  add column if not exists page integer check (page in (1, 2)),
  add column if not exists is_featured boolean not null default false;
