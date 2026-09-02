-- Extensão da tabela partners com campos de detalhe
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new

alter table public.partners
  add column if not exists slug        text unique,
  add column if not exists description text,
  add column if not exists cover_url   text,
  add column if not exists phone       text,
  add column if not exists whatsapp    text,
  add column if not exists instagram   text,
  add column if not exists facebook    text,
  add column if not exists city        text,
  add column if not exists state       text;

-- Preencher slug para registros existentes que ainda não têm
update public.partners
set slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;
