-- Unidade de medida do produto (kg, m², un, milheiro etc). Validade continua
-- só na edição (tabloid_editions.valid_from/valid_until) — não é mais pedida
-- por produto no formulário, mas as colunas antigas em tabloid_products
-- ficam intocadas (dados existentes não se perdem).

alter table public.tabloid_products
  add column if not exists unit text;
