-- Rodapé estruturado do tabloide (só verso / página 2): logo da loja,
-- contato, selo do centro, chamada WhatsApp e letras miúdas. JSON pra
-- cada bloco ser preenchido à parte. `footer_text` antigo continua no
-- banco e só entra como fallback das letras miúdas se o JSON ainda
-- estiver vazio.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 007_tabloide_portal.sql (tabela tabloid_editions) já aplicada.

alter table public.tabloid_editions
  add column if not exists footer jsonb not null default '{}'::jsonb;
