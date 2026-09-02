-- Garante 1 destaque por página POR LOJA: se já existir mais de um
-- (dados antigos), fica só o mais antigo; o índice único cobre o resto.

with ranked as (
  select
    id,
    row_number() over (
      partition by edition_id, associate_id, page
      order by created_at asc, id asc
    ) as rn
  from public.tabloid_products
  where is_featured = true and page is not null
)
update public.tabloid_products p
   set is_featured = false
  from ranked r
 where p.id = r.id
   and r.rn > 1;

create unique index if not exists tabloid_products_one_featured_per_store_page
  on public.tabloid_products (edition_id, associate_id, page)
  where is_featured = true;
