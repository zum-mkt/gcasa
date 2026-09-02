-- Mario pediu: o associado precisa conseguir apagar um tabloide que ele
-- mesmo criou (fez e enviou), não só "desfazer o envio" (que já existia,
-- 017_tabloid_associate_workflow.sql — volta a edição pra editável, mas o
-- tabloide continua existindo). Agora ele também pode excluir o tabloide
-- inteiro (cascade já apaga os produtos e o envio, ver FKs de
-- 007_tabloide_portal.sql/011_tabloide_producao.sql).
--
-- Só pode apagar o que ELE criou (created_by_associate_id, 018) — continua
-- não podendo apagar uma edição criada pelo admin ou por outro associado,
-- já que isso derrubaria produto de loja de terceiro junto (mesmo motivo que
-- manteve delete só-admin até agora). Isso só ADICIONA uma policy nova —
-- não mexe na policy de admin já existente (RLS soma as duas com OR).
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 018_tabloid_edition_creator.sql (coluna created_by_associate_id) já aplicada.

drop policy if exists "tabloid_editions_delete_own" on public.tabloid_editions;
create policy "tabloid_editions_delete_own" on public.tabloid_editions
  for delete using (created_by_associate_id = public.current_associate_id());
