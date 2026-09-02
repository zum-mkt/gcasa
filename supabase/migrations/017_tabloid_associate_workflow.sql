-- Passo a passo do associado em /portal/produtos (pedido do Mario,
-- 2026-08-12): 1) escolher entre criar tabloide novo ou continuar um aberto;
-- 2) criar só com informações básicas (sem produto ainda); 3) subir
-- produtos; 4) editar/distribuir página 1 x 2; 5) enviar pra produção —
-- a partir daí o associado NÃO pode mais editar aquele tabloide, ele vira só
-- um "arquivo" (nome + data do envio); 6) se precisar desfazer, o associado
-- pode apagar o próprio envio — isso reabre a edição pra ele editar de novo
-- E avisa o admin (mensagem diferente da de "pronto pra finalizar") que
-- precisa conferir/anular manualmente o que já tiver processado.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 011 (tabloid_submissions), 012_notifications, 016 (archived_at) já aplicadas.

-- ============================================================
-- 1) Associado pode apagar (cancelar) o PRÓPRIO envio — não existia policy
--    de delete nenhuma em tabloid_submissions até agora.
-- ============================================================
drop policy if exists "tabloid_submissions_delete_own" on public.tabloid_submissions;
create policy "tabloid_submissions_delete_own" on public.tabloid_submissions
  for delete using (associate_id = public.current_associate_id());

-- ============================================================
-- 2) Trava de edição: enquanto existir um envio (tabloid_submissions) do
--    associado pra aquela edição, ele não pode mais criar/editar/excluir
--    produto dela — só voltar a editar depois de apagar o próprio envio.
--    Admin nunca é afetado (continua liberado via is_admin()).
-- ============================================================
create or replace function public.associate_has_active_submission(p_edition_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tabloid_submissions
    where edition_id = p_edition_id and associate_id = public.current_associate_id()
  );
$$;

drop policy if exists "tabloid_products_insert_own" on public.tabloid_products;
create policy "tabloid_products_insert_own" on public.tabloid_products
  for insert with check (
    (associate_id = public.current_associate_id() and not public.associate_has_active_submission(edition_id))
    or public.is_admin()
  );

drop policy if exists "tabloid_products_update_own_pending_or_admin" on public.tabloid_products;
create policy "tabloid_products_update_own_pending_or_admin" on public.tabloid_products
  for update using (
    (associate_id = public.current_associate_id() and status = 'pending' and not public.associate_has_active_submission(edition_id))
    or public.is_admin()
  );

drop policy if exists "tabloid_products_delete_own_pending_or_admin" on public.tabloid_products;
create policy "tabloid_products_delete_own_pending_or_admin" on public.tabloid_products
  for delete using (
    (associate_id = public.current_associate_id() and status = 'pending' and not public.associate_has_active_submission(edition_id))
    or public.is_admin()
  );

-- ============================================================
-- 3) RPC pro passo "distribuir página 1 x 2": contagem de produtos por
--    página NA EDIÇÃO INTEIRA (todos os associados somados) — mesmo motivo
--    da RPC de destaque (013): a RLS de tabloid_products só deixa cada
--    associado ver os PRÓPRIOS produtos, então o front não tem como saber o
--    total real sem essa função (só expõe contagem, nada de produto/preço).
-- ============================================================
create or replace function public.tabloid_page_counts(p_edition_id uuid)
returns table(page_1_count int, page_2_count int)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where page = 1)::int,
    count(*) filter (where page = 2)::int
  from public.tabloid_products
  where edition_id = p_edition_id;
$$;

grant execute on function public.tabloid_page_counts(uuid) to authenticated;

-- ============================================================
-- 4) Notificação também no CANCELAMENTO (delete), com mensagem diferente da
--    de envio — reescreve a trigger da 012_notifications.sql pra cobrir os
--    dois casos (TG_OP).
-- ============================================================
create or replace function public.notify_admins_tabloid_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assoc_name   text;
  edition_name text;
begin
  if TG_OP = 'DELETE' then
    select name into assoc_name from public.associates where id = old.associate_id;
    select name into edition_name from public.tabloid_editions where id = old.edition_id;

    insert into public.notifications (recipient_id, type, title, message, link)
    select
      p.id,
      'tabloid_submission_cancelled',
      'Envio de tabloide cancelado',
      coalesce(assoc_name, 'Um associado') || ' cancelou o envio do tabloide "' || coalesce(edition_name, 'uma edição') ||
        '" — confira os produtos dessa loja e anule/reverta o que já tiver processado.',
      '/admin/tabloides'
    from public.profiles p
    where p.role in ('admin', 'editor');

    return old;
  else
    select name into assoc_name from public.associates where id = new.associate_id;
    select name into edition_name from public.tabloid_editions where id = new.edition_id;

    insert into public.notifications (recipient_id, type, title, message, link)
    select
      p.id,
      'tabloid_submission',
      'Tabloide pronto pra finalizar',
      coalesce(assoc_name, 'Um associado') || ' enviou os produtos de "' || coalesce(edition_name, 'uma edição') ||
        '" pra produção. O arquivo está pronto pra revisão e finalização.',
      '/admin/tabloides'
    from public.profiles p
    where p.role in ('admin', 'editor');

    return new;
  end if;
end;
$$;

drop trigger if exists tabloid_submission_notify on public.tabloid_submissions;
create trigger tabloid_submission_notify
  after insert or update or delete on public.tabloid_submissions
  for each row execute procedure public.notify_admins_tabloid_submission();
