-- Estilo dos preços no preview/impressão do tabloide (cor, tamanho, splash
-- de encarte, "de/por", selo SUPER OFERTA). JSON pra não espalhar 5 colunas
-- novas — o front normaliza com DEFAULT_TABLOID_PRICE_STYLE se faltar campo.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 007_tabloide_portal.sql (tabela tabloid_editions) já aplicada.

alter table public.tabloid_editions
  add column if not exists price_style jsonb not null default '{
    "color": "#DC2626",
    "size": "lg",
    "splash": "promo",
    "fromTo": true,
    "badge": true
  }'::jsonb;
