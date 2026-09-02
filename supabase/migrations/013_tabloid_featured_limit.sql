-- Regra pedida pelo Mario: cada produto do tabloide tem que ter página (1 ou
-- 2) definida — e só pode existir 1 produto em destaque por página em cada
-- edição (1 na página 1/capa, 1 na página 2), somando TODOS os associados —
-- não é 1 destaque por loja, é 1 destaque no layout inteiro por página.
--
-- A obrigatoriedade de escolher página é validada no formulário do associado
-- (front-end); aqui no banco só entra a trava que protege o "1 por página",
-- que precisa ser aqui porque vários associados diferentes enviam pra mesma
-- edição — só validação no front não segura corrida entre duas lojas
-- marcando destaque quase ao mesmo tempo.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
-- Pré-requisito: 009_tabloid_smart_entry.sql (colunas page/is_featured) já aplicada.

-- Não permite marcar destaque sem página definida (senão a trava de "1 por
-- página" logo abaixo não teria o que comparar).
alter table public.tabloid_products drop constraint if exists tabloid_products_featured_requires_page;
alter table public.tabloid_products
  add constraint tabloid_products_featured_requires_page
  check (not is_featured or page is not null);

-- Só 1 linha com is_featured = true por (edition_id, page) — vale pra
-- inserção do associado E pra curadoria do admin, sem distinção.
drop index if exists tabloid_products_one_featured_per_page;
create unique index tabloid_products_one_featured_per_page
  on public.tabloid_products (edition_id, page)
  where is_featured = true;

-- RPC pro portal do associado: como a RLS de tabloid_products só deixa cada
-- associado ver os PRÓPRIOS produtos (não pode enxergar produto/preço de
-- outra loja), o front não tem como saber se a página 1 ou 2 já tem destaque
-- de outro associado. Essa função devolve só as páginas já ocupadas (sem
-- nome de produto, sem associado, sem preço) — o mínimo pra desabilitar o
-- checkbox "Destaque" na hora certa. A trava de verdade continua sendo o
-- índice único acima; isso aqui é só pra dar feedback antes do envio.
create or replace function public.tabloid_taken_featured_pages(p_edition_id uuid)
returns int[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct page), array[]::int[])
  from public.tabloid_products
  where edition_id = p_edition_id and is_featured = true and page is not null;
$$;

grant execute on function public.tabloid_taken_featured_pages(uuid) to authenticated;
