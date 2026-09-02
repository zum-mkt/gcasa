-- "Envio dos associados" na curadoria (`admin/Tabloides`) virou uma lista de
-- verdade em vez de só um badge com nome — agora mostra quando cada
-- associado enviou + quantos produtos (pendente/aprovado/rejeitado), separa
-- quem "precisa de ação" (não enviou ainda, ou enviou mas ainda tem produto
-- pendente de revisão) de quem já foi revisado, e o admin pode ARQUIVAR o
-- envio de uma loja depois de revisado — só some da lista principal, fica
-- guardado e pode reabrir se precisar.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 011_tabloide_producao.sql (cria tabloid_submissions) já aplicada.

alter table public.tabloid_submissions
  add column if not exists archived_at timestamptz;

-- A policy de update existente (011) só cobre o próprio associado (reenviar,
-- atualiza submitted_at) — arquivar/reabrir é ação do admin, faltava essa.
drop policy if exists "tabloid_submissions_update_admin" on public.tabloid_submissions;
create policy "tabloid_submissions_update_admin" on public.tabloid_submissions
  for update using (public.is_admin());
