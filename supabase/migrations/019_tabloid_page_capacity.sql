-- Limite de produtos por página do tabloide impresso (pedido do Mario:
-- 20 por página, 40 no total — configurável por edição porque o template do
-- InDesign pode mudar). O front já calcula e desabilita a página cheia no
-- dropdown antes de enviar, mas a trava de verdade tem que ser aqui — dois
-- associados diferentes podem estourar o limite quase ao mesmo tempo, e só
-- validação de front não segura isso (mesmo raciocínio do índice único do
-- destaque em 013_tabloid_featured_limit.sql).
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 009_tabloid_smart_entry.sql (coluna page) já aplicada.

alter table public.tabloid_editions
  add column if not exists max_products_per_page integer not null default 20;

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
    return new; -- sem página ainda — nada a checar (o front já obriga escolher antes de enviar)
  end if;

  -- Update que não muda de edição/página não precisa recontar.
  if TG_OP = 'UPDATE' and OLD.page = NEW.page and OLD.edition_id = NEW.edition_id then
    return new;
  end if;

  select max_products_per_page into max_per_page from public.tabloid_editions where id = new.edition_id;
  if max_per_page is null then
    return new;
  end if;

  select count(*) into current_count
  from public.tabloid_products
  where edition_id = new.edition_id
    and page = new.page
    and (TG_OP = 'INSERT' or id <> new.id);

  if current_count >= max_per_page then
    raise exception 'tabloid_page_capacity_exceeded (edição %, página %, limite %)', new.edition_id, new.page, max_per_page
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists tabloid_products_page_capacity on public.tabloid_products;
create trigger tabloid_products_page_capacity
  before insert or update on public.tabloid_products
  for each row execute procedure public.enforce_tabloid_page_capacity();
