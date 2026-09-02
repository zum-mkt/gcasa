-- Adiciona a coluna category, usada pelo formulário de Parceiros mas nunca criada no banco
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new

alter table public.partners
  add column if not exists category text;
