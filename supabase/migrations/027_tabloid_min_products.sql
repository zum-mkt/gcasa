-- Mínimo de 24 produtos da LOJA pra enviar o tabloide (pedido do Mario:
-- 24 no tabloide todo, 40 no máximo). O máximo por página já é a trigger
-- `enforce_tabloid_page_capacity` (20 por página = 40 no total).
--
-- A trava de verdade fica aqui: o portal desabilita o botão, mas o associado
-- não pode furar o mínimo com um upsert direto.

create or replace function public.enforce_tabloid_min_products()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
  min_total constant int := 24;
begin
  -- Arquivar / desarquivar não revalida o mínimo.
  if TG_OP = 'UPDATE' and OLD.submitted_at is not distinct from NEW.submitted_at then
    return new;
  end if;

  select count(*)::int into n
  from public.tabloid_products
  where edition_id = new.edition_id
    and associate_id = new.associate_id
    and page in (1, 2);

  if n < min_total then
    raise exception 'tabloid_min_products_not_met (loja %, tem %, mínimo %)', new.associate_id, n, min_total
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists tabloid_submissions_min_products on public.tabloid_submissions;
create trigger tabloid_submissions_min_products
  before insert or update on public.tabloid_submissions
  for each row execute procedure public.enforce_tabloid_min_products();
