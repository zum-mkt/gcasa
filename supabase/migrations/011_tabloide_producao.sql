-- Botão "enviar tabloide pra produção" (associado sinaliza que terminou de
-- adicionar produtos pra uma edição) + campos gerais da edição que faltavam
-- (texto de rodapé/letras miúdas, observações internas).

alter table public.tabloid_editions
  add column if not exists footer_text text,
  add column if not exists notes text;

create table if not exists public.tabloid_submissions (
  id           uuid primary key default uuid_generate_v4(),
  edition_id   uuid not null references public.tabloid_editions(id) on delete cascade,
  associate_id uuid not null references public.associates(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  unique (edition_id, associate_id)
);

alter table public.tabloid_submissions enable row level security;

-- Associado vê/envia só o próprio; admin vê tudo (pra saber quem já mandou).
drop policy if exists "tabloid_submissions_select_own_or_admin" on public.tabloid_submissions;
create policy "tabloid_submissions_select_own_or_admin" on public.tabloid_submissions
  for select using (associate_id = public.current_associate_id() or public.is_admin());

drop policy if exists "tabloid_submissions_insert_own" on public.tabloid_submissions;
create policy "tabloid_submissions_insert_own" on public.tabloid_submissions
  for insert with check (associate_id = public.current_associate_id());

-- Update permite reenviar (atualiza submitted_at) se adicionar mais produtos depois.
drop policy if exists "tabloid_submissions_update_own" on public.tabloid_submissions;
create policy "tabloid_submissions_update_own" on public.tabloid_submissions
  for update using (associate_id = public.current_associate_id());
