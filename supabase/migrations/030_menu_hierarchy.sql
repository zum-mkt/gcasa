-- Menu hierárquico: itens podem ter um pai (um nível de submenu).
-- Substitui o menu plano da 005 pela árvore agrupada por contexto.

alter table public.menu_items
  add column if not exists parent_id uuid references public.menu_items(id) on delete cascade;

create index if not exists menu_items_parent_idx on public.menu_items(parent_id);

-- A árvore nova não reaproveita os itens antigos (destinos e agrupamento mudam).
delete from public.menu_items where parent_id is not null;
delete from public.menu_items;

-- Pais
insert into public.menu_items (id, label, order_index, type, path, url, anchor, open_new_tab, parent_id) values
  ('a1000000-0000-4000-8000-000000000001', 'O Grupo',       0, 'internal_page', '/quem-somos',  null, null, false, null),
  ('a1000000-0000-4000-8000-000000000002', 'Associados',    1, 'internal_page', '/associados',  null, null, false, null),
  ('a1000000-0000-4000-8000-000000000003', 'Fornecedores',  2, 'internal_page', '/fornecedores',null, null, false, null),
  ('a1000000-0000-4000-8000-000000000004', 'Eventos',       3, 'internal_page', '/eventos',     null, null, false, null),
  ('a1000000-0000-4000-8000-000000000005', 'Blog',          4, 'internal_page', '/blog',        null, null, false, null),
  ('a1000000-0000-4000-8000-000000000006', 'Contato',       5, 'internal_page', '/contato',     null, null, false, null);

-- O Grupo
insert into public.menu_items (id, label, order_index, type, path, url, anchor, open_new_tab, parent_id) values
  ('a1000000-0000-4000-8000-000000000011', 'Quem Somos',               0, 'internal_page', '/quem-somos',          null, null, false, 'a1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000012', 'Missão, Visão e Valores',  1, 'internal_page', '/quem-somos#missao',    null, null, false, 'a1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000013', 'Nossa história',           2, 'internal_page', '/quem-somos#historia',  null, null, false, 'a1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000014', 'Estatuto',                 3, 'internal_page', '/estatuto',             null, null, false, 'a1000000-0000-4000-8000-000000000001'),
  ('a1000000-0000-4000-8000-000000000015', 'Código de Ética',          4, 'internal_page', '/codigo-etica',         null, null, false, 'a1000000-0000-4000-8000-000000000001');

-- Associados
insert into public.menu_items (id, label, order_index, type, path, url, anchor, open_new_tab, parent_id) values
  ('a1000000-0000-4000-8000-000000000021', 'Empresas associadas',  0, 'internal_page', '/associados',          null, null, false, 'a1000000-0000-4000-8000-000000000002'),
  ('a1000000-0000-4000-8000-000000000022', 'Benefícios',           1, 'internal_page', '/quem-somos#beneficios',null, null, false, 'a1000000-0000-4000-8000-000000000002'),
  ('a1000000-0000-4000-8000-000000000023', 'Quero me associar',    2, 'internal_page', '/quero-me-associar',   null, null, false, 'a1000000-0000-4000-8000-000000000002'),
  ('a1000000-0000-4000-8000-000000000024', 'Área do associado',    3, 'internal_page', '/portal',              null, null, false, 'a1000000-0000-4000-8000-000000000002');

-- Fornecedores
insert into public.menu_items (id, label, order_index, type, path, url, anchor, open_new_tab, parent_id) values
  ('a1000000-0000-4000-8000-000000000031', 'Rede de fornecedores', 0, 'internal_page', '/fornecedores',    null, null, false, 'a1000000-0000-4000-8000-000000000003'),
  ('a1000000-0000-4000-8000-000000000032', 'Quero ser fornecedor', 1, 'internal_page', '/sou-fornecedor',  null, null, false, 'a1000000-0000-4000-8000-000000000003');

-- Eventos
insert into public.menu_items (id, label, order_index, type, path, url, anchor, open_new_tab, parent_id) values
  ('a1000000-0000-4000-8000-000000000041', 'Agenda de eventos', 0, 'internal_page', '/eventos', null, null, false, 'a1000000-0000-4000-8000-000000000004'),
  ('a1000000-0000-4000-8000-000000000042', 'Plataforma EAD',    1, 'external_url',  null, 'https://ead.grupogcasa.com.br/', null, true, 'a1000000-0000-4000-8000-000000000004');
