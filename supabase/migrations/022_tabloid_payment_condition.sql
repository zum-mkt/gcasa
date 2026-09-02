-- Mario reportou: ao colar lista, condição de pagamento ("3x de R$ 160,00
-- sem juros", "R$ 55,10 à vista (5% OFF)") não tinha campo próprio — e como
-- a linha da condição geralmente tem um valor em R$ junto (a parcela, ou o
-- preço à vista), o parser (IA e o local) confundia e cadastrava como um
-- PRODUTO NOVO em vez de um detalhe do produto anterior.
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new

alter table public.tabloid_products
  add column if not exists payment_condition text;
