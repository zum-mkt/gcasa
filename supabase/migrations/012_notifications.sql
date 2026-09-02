-- Notificações in-app: quando o associado envia o tabloide pra produção
-- ("Enviar tabloide pra produção" em /portal/produtos), admin/editor recebem
-- um aviso de que o arquivo está pronto pra revisão/finalização — hoje esse
-- sinal só existia como badge passivo (verde/cinza) dentro da curadoria de
-- cada edição, o que exige o admin abrir a edição certa pra notar.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 011_tabloide_producao.sql (cria tabloid_submissions) já aplicada.

create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type         text not null default 'info',
  title        text not null,
  message      text,
  -- Rota do admin pra abrir ao clicar (ex: '/admin/tabloides') — sem coluna de
  -- entidade relacionada por enquanto, um link direto resolve a navegação.
  link         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

-- Cada usuário só vê/marca como lida a própria notificação. Não existe policy
-- de insert pra usuário comum de propósito — só a trigger abaixo (security
-- definer) cria notificação, então ninguém autenticado consegue mandar
-- notificação pra si mesmo ou pra terceiros direto pela API.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (recipient_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (recipient_id = auth.uid());

-- Trigger: toda vez que um associado envia (ou reenvia) o tabloide pra
-- produção, avisa todo admin/editor — mesmo padrão de security-definer já
-- usado em public.is_admin()/public.current_associate_id() (bypassa RLS pra
-- poder inserir notificação pra outro usuário).
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
end;
$$;

drop trigger if exists tabloid_submission_notify on public.tabloid_submissions;
create trigger tabloid_submission_notify
  after insert or update on public.tabloid_submissions
  for each row execute procedure public.notify_admins_tabloid_submission();
