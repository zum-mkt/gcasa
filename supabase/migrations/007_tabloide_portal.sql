-- Portal de associados + compilação de produtos para tabloides de vendas.
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new

-- Associado logado: novo papel + vínculo com a linha de `associates`
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','editor','associate'));
alter table public.profiles add column if not exists associate_id uuid references public.associates(id);

-- Helper security-definer, mesmo padrão de public.is_admin() (004_fix_profiles_recursion.sql)
create or replace function public.current_associate_id()
returns uuid
language sql
stable
security definer
as $$
  select associate_id from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- TABELA: tabloid_editions — cada "edição"/rodada do tabloide
-- ============================================================
create table if not exists public.tabloid_editions (
  id                   uuid primary key default uuid_generate_v4(),
  name                 text not null,
  status               text default 'draft' check (status in ('draft','open','closed','published')),
  submission_deadline  date,
  valid_from           date,
  valid_until          date,
  generated_pdf_url    text,
  created_at           timestamptz default now() not null,
  updated_at           timestamptz default now() not null
);

drop trigger if exists tabloid_editions_updated_at on public.tabloid_editions;
create trigger tabloid_editions_updated_at
  before update on public.tabloid_editions
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: tabloid_products — produtos enviados pelos associados
-- ============================================================
create table if not exists public.tabloid_products (
  id               uuid primary key default uuid_generate_v4(),
  edition_id       uuid not null references public.tabloid_editions(id) on delete cascade,
  associate_id     uuid not null references public.associates(id) on delete cascade,
  name             text not null,
  description      text,
  category         text,
  sku              text,
  price            numeric(10,2),
  promo_price      numeric(10,2),
  image_url        text,
  valid_from       date,
  valid_until      date,
  status           text default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  order_index      integer default 0,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

drop trigger if exists tabloid_products_updated_at on public.tabloid_products;
create trigger tabloid_products_updated_at
  before update on public.tabloid_products
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.tabloid_editions enable row level security;
alter table public.tabloid_products enable row level security;

-- ── EDITIONS ─────────────────────────────────────────────────
-- Qualquer autenticado vê (associado precisa ver quais estão "open" pra saber
-- onde enviar produtos); só admin cria/edita/exclui.
drop policy if exists "tabloid_editions_select_auth" on public.tabloid_editions;
create policy "tabloid_editions_select_auth" on public.tabloid_editions
  for select using (auth.role() = 'authenticated');

drop policy if exists "tabloid_editions_write_admin" on public.tabloid_editions;
create policy "tabloid_editions_write_admin" on public.tabloid_editions
  for all using (public.is_admin());

-- ── PRODUCTS ─────────────────────────────────────────────────
-- Associado só enxerga/mexe nos próprios produtos; admin enxerga/mexe em tudo.
-- Update/delete do associado só funciona enquanto o produto está 'pending' —
-- depois que o admin aprova/rejeita, só admin pode alterar.
drop policy if exists "tabloid_products_select_own_or_admin" on public.tabloid_products;
create policy "tabloid_products_select_own_or_admin" on public.tabloid_products
  for select using (associate_id = public.current_associate_id() or public.is_admin());

drop policy if exists "tabloid_products_insert_own" on public.tabloid_products;
create policy "tabloid_products_insert_own" on public.tabloid_products
  for insert with check (associate_id = public.current_associate_id() or public.is_admin());

drop policy if exists "tabloid_products_update_own_pending_or_admin" on public.tabloid_products;
create policy "tabloid_products_update_own_pending_or_admin" on public.tabloid_products
  for update using (
    (associate_id = public.current_associate_id() and status = 'pending')
    or public.is_admin()
  );

drop policy if exists "tabloid_products_delete_own_pending_or_admin" on public.tabloid_products;
create policy "tabloid_products_delete_own_pending_or_admin" on public.tabloid_products
  for delete using (
    (associate_id = public.current_associate_id() and status = 'pending')
    or public.is_admin()
  );
