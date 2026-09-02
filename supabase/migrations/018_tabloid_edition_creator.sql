-- Desde a 014/015, qualquer associado pode criar uma edição de tabloide
-- sozinho (não trava mais esperando o admin) — mas a lista de edições em
-- /admin/tabloides não tinha como dizer QUEM criou cada uma. Com vários
-- associados cada um clicando "Criar novo tabloide", o admin fica sem saber
-- de quem é qual linha na tabela.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 007 (associates/current_associate_id), 014/015 (insert liberado pra associado) já aplicadas.

alter table public.tabloid_editions
  add column if not exists created_by_associate_id uuid references public.associates(id);

-- Default via função (não confia em valor que o client mande) — preenche
-- sozinho com o associado autenticado no momento do insert; fica null
-- quando quem cria é admin (current_associate_id() só retorna algo pra
-- profiles com role='associate', ver 007_tabloide_portal.sql).
alter table public.tabloid_editions
  alter column created_by_associate_id set default public.current_associate_id();

-- Edições criadas antes dessa coluna existir ficam com created_by_associate_id
-- null (não tem como saber retroativamente quem criou) — a UI mostra "—" nesse caso.
