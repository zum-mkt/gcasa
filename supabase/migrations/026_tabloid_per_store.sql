-- Tema (edição) é do admin: capa padrão + selo/letras miúdas.
-- Cada loja preenche o MIOLO (produtos) e os dados dela no rodapé
-- (logo, telefone, WhatsApp). Capa pode ter uma variação por loja
-- (admin sobe), senão vale a capa do tema.
--
-- Destaque e capacidade de página passam a ser POR LOJA — cada
-- tabloide impresso é o daquela loja, não a soma de todas.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 013 (destaque), 017 (page counts), 019 (capacidade), 025 (footer).

-- ============================================================
-- Layout por loja (capa override + rodapé da loja)
-- ============================================================
create table if not exists public.tabloid_store_layouts (
  id                 uuid primary key default gen_random_uuid(),
  edition_id         uuid not null references public.tabloid_editions(id) on delete cascade,
  associate_id       uuid not null references public.associates(id) on delete cascade,
  header_image_url   text,
  footer             jsonb not null default '{}'::jsonb,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null,
  unique (edition_id, associate_id)
);

drop trigger if exists tabloid_store_layouts_updated_at on public.tabloid_store_layouts;
create trigger tabloid_store_layouts_updated_at
  before update on public.tabloid_store_layouts
  for each row execute procedure public.set_updated_at();

alter table public.tabloid_store_layouts enable row level security;

drop policy if exists "tabloid_store_layouts_select" on public.tabloid_store_layouts;
create policy "tabloid_store_layouts_select" on public.tabloid_store_layouts
  for select using (associate_id = public.current_associate_id() or public.is_admin());

drop policy if exists "tabloid_store_layouts_insert" on public.tabloid_store_layouts;
create policy "tabloid_store_layouts_insert" on public.tabloid_store_layouts
  for insert with check (associate_id = public.current_associate_id() or public.is_admin());

drop policy if exists "tabloid_store_layouts_update" on public.tabloid_store_layouts;
create policy "tabloid_store_layouts_update" on public.tabloid_store_layouts
  for update using (associate_id = public.current_associate_id() or public.is_admin());

-- ============================================================
-- 1 destaque por página POR LOJA (não mais na edição inteira)
-- ============================================================
drop index if exists tabloid_products_one_featured_per_page;
create unique index if not exists tabloid_products_one_featured_per_store_page
  on public.tabloid_products (edition_id, associate_id, page)
  where is_featured = true;

create or replace function public.tabloid_taken_featured_pages(p_edition_id uuid)
returns int[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct page), array[]::int[])
  from public.tabloid_products
  where edition_id = p_edition_id
    and is_featured = true
    and page is not null
    and associate_id = public.current_associate_id();
$$;

-- ============================================================
-- Capacidade de página POR LOJA
-- ============================================================
create or replace function public.enforce_tabloid_page_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  max_per_page int;
  current_count int;
begin
  if new.page is null then
    return new;
  end if;

  if TG_OP = 'UPDATE' and OLD.page = NEW.page and OLD.edition_id = NEW.edition_id and OLD.associate_id = NEW.associate_id then
    return new;
  end if;

  select max_products_per_page into max_per_page from public.tabloid_editions where id = new.edition_id;
  if max_per_page is null then
    return new;
  end if;

  select count(*) into current_count
  from public.tabloid_products
  where edition_id = new.edition_id
    and associate_id = new.associate_id
    and page = new.page
    and (TG_OP = 'INSERT' or id <> new.id);

  if current_count >= max_per_page then
    raise exception 'tabloid_page_capacity_exceeded (edição %, loja %, página %, limite %)', new.edition_id, new.associate_id, new.page, max_per_page
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

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
  where edition_id = p_edition_id
    and associate_id = public.current_associate_id();
$$;
