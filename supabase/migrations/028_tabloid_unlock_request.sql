-- Depois do envio o associado NÃO reabre sozinho (pedido do Mario):
-- o tabloide sai das mãos dele e vai pra gráfica. Se quiser mudar, pede
-- ao admin; o admin vê o pedido (notificação + faixa) e, se ainda der tempo,
-- libera a edição (apaga o envio — os produtos continuam).
--
-- Pré-requisito: 017 (delete_own + notify trigger), 027 (mínimo 24).

-- ============================================================
-- 1) Pedido de desbloqueio no envio
-- ============================================================
alter table public.tabloid_submissions
  add column if not exists unlock_requested_at timestamptz;

create index if not exists tabloid_submissions_unlock_requested_idx
  on public.tabloid_submissions (unlock_requested_at)
  where unlock_requested_at is not null;

-- Admin e editor (staff) — security definer pra não reentrar na RLS de profiles.
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

-- Associado não apaga mais o próprio envio (era o "reabrir").
drop policy if exists "tabloid_submissions_delete_own" on public.tabloid_submissions;

drop policy if exists "tabloid_submissions_delete_admin" on public.tabloid_submissions;
create policy "tabloid_submissions_delete_admin" on public.tabloid_submissions
  for delete using (public.is_staff());

-- Staff vê todos os envios (faixa de pedido no admin). Associado só o próprio.
drop policy if exists "tabloid_submissions_select_own_or_admin" on public.tabloid_submissions;
create policy "tabloid_submissions_select_own_or_admin" on public.tabloid_submissions
  for select using (
    associate_id = public.current_associate_id()
    or public.is_admin()
    or public.is_staff()
  );

-- Associado não atualiza mais o envio (não reenvia/arquiva por UPDATE).
-- Pedido de alteração e liberação passam pelas RPCs abaixo (security definer).
drop policy if exists "tabloid_submissions_update_own" on public.tabloid_submissions;

-- ============================================================
-- 2) RPC: associado pede pra alterar
-- ============================================================
create or replace function public.request_tabloid_unlock(p_edition_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  assoc uuid;
  updated int;
begin
  assoc := public.current_associate_id();
  if assoc is null then
    raise exception 'tabloid_unlock_not_associate' using errcode = 'P0001';
  end if;

  update public.tabloid_submissions
     set unlock_requested_at = now()
   where edition_id = p_edition_id
     and associate_id = assoc
     and unlock_requested_at is null;

  get diagnostics updated = row_count;
  if updated = 0 then
    -- Já pediu, ou não tem envio. Distingue os dois.
    if exists (
      select 1 from public.tabloid_submissions
      where edition_id = p_edition_id and associate_id = assoc
    ) then
      return false; -- pedido já estava em aberto
    end if;
    raise exception 'tabloid_unlock_no_submission' using errcode = 'P0001';
  end if;

  return true;
end;
$$;

grant execute on function public.request_tabloid_unlock(uuid) to authenticated;

-- ============================================================
-- 3) RPC: admin/editor libera (apaga o envio; produtos ficam)
-- ============================================================
create or replace function public.unlock_tabloid_submission(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'tabloid_unlock_not_staff' using errcode = 'P0001';
  end if;

  delete from public.tabloid_submissions where id = p_submission_id;
  if not found then
    raise exception 'tabloid_unlock_missing' using errcode = 'P0001';
  end if;
end;
$$;

grant execute on function public.unlock_tabloid_submission(uuid) to authenticated;

-- ============================================================
-- 4) Notificações: envio novo vs pedido de alteração (urgente)
--    Não dispara mais no arquivar (UPDATE de archived_at).
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
  edition_id_  uuid;
begin
  if TG_OP = 'DELETE' then
    select name into edition_name from public.tabloid_editions where id = old.edition_id;
    -- Cascade ao apagar a edição: não notifica "liberado".
    if edition_name is null then
      return old;
    end if;
    select name into assoc_name from public.associates where id = old.associate_id;

    insert into public.notifications (recipient_id, type, title, message, link)
    select
      p.id,
      'tabloid_unlocked',
      'Tabloide liberado pra edição',
      coalesce(assoc_name, 'Uma loja') || ' pode editar de novo o tabloide "' ||
        coalesce(edition_name, 'uma edição') || '".',
      '/admin/tabloides?edicao=' || old.edition_id::text
    from public.profiles p
    where p.role in ('admin', 'editor');

    return old;
  end if;

  if TG_OP = 'INSERT' then
    select name into assoc_name from public.associates where id = new.associate_id;
    select name into edition_name from public.tabloid_editions where id = new.edition_id;

    insert into public.notifications (recipient_id, type, title, message, link)
    select
      p.id,
      'tabloid_submission',
      'Tabloide pronto pra finalizar',
      coalesce(assoc_name, 'Um associado') || ' enviou os produtos de "' ||
        coalesce(edition_name, 'uma edição') || '" pra produção.',
      '/admin/tabloides?edicao=' || new.edition_id::text
    from public.profiles p
    where p.role in ('admin', 'editor');

    return new;
  end if;

  -- UPDATE: só avisa se nasceu um pedido de alteração.
  if new.unlock_requested_at is not null
     and old.unlock_requested_at is null then
    select name into assoc_name from public.associates where id = new.associate_id;
    select name into edition_name from public.tabloid_editions where id = new.edition_id;
    edition_id_ := new.edition_id;

    insert into public.notifications (recipient_id, type, title, message, link)
    select
      p.id,
      'tabloid_unlock_request',
      'URGENTE: loja pediu pra alterar o tabloide',
      coalesce(assoc_name, 'Uma loja') || ' quer editar "' ||
        coalesce(edition_name, 'um tabloide') ||
        '" depois do envio. Veja se ainda dá tempo de mudar antes da gráfica e, se der, libere a edição.',
      '/admin/tabloides?edicao=' || edition_id_::text
    from public.profiles p
    where p.role in ('admin', 'editor');
  end if;

  return new;
end;
$$;
