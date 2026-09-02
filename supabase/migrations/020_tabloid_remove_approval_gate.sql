-- Mario pediu: quem monta o tabloide não precisa aprovar produto um a um.
-- Assim que o associado envia ("Enviar tabloide pra produção"), os produtos
-- dele já contam como prontos pra exportar/imprimir — o admin edita o que
-- quiser (ou não mexe em nada), sem um passo formal de "aprovar"/"rejeitar".
--
-- Não dropei as colunas `status`/`rejection_reason` de tabloid_products (ficam
-- sem uso, sem risco — mesmo padrão de `valid_from`/`valid_until` que sobrou
-- sem uso na 010_tabloid_unit.sql). O que muda de verdade é a RLS: antes só
-- dava pra o associado editar/apagar o PRÓPRIO produto enquanto
-- `status = 'pending'` — isso já tinha virado redundante desde a
-- 017_tabloid_associate_workflow.sql (trava real passou a ser "não ter
-- enviado ainda"), e agora fica só essa trava, sem depender de status.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 017_tabloid_associate_workflow.sql (associate_has_active_submission) já aplicada.

drop policy if exists "tabloid_products_update_own_pending_or_admin" on public.tabloid_products;
create policy "tabloid_products_update_own_pending_or_admin" on public.tabloid_products
  for update using (
    (associate_id = public.current_associate_id() and not public.associate_has_active_submission(edition_id))
    or public.is_admin()
  );

drop policy if exists "tabloid_products_delete_own_pending_or_admin" on public.tabloid_products;
create policy "tabloid_products_delete_own_pending_or_admin" on public.tabloid_products
  for delete using (
    (associate_id = public.current_associate_id() and not public.associate_has_active_submission(edition_id))
    or public.is_admin()
  );
