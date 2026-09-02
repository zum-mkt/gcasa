-- Cor de fundo do tabloide impresso (frente e verso). O preview em
-- /admin/tabloides/:id/preview e o formulário da edição deixam escolher
-- entre a paleta da marca ou uma cor livre. Sem isso o fundo ficava
-- branco puro e o encarte "estourava" na impressão.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 007_tabloide_portal.sql (tabela tabloid_editions) já aplicada.

alter table public.tabloid_editions
  add column if not exists background_color text not null default '#FFF8E9';
