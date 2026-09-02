-- Itens do menu principal, gerenciáveis pelo admin
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new

create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  order_index   integer not null default 0,
  is_active     boolean not null default true,
  type          text not null check (type in ('external_url', 'anchor', 'internal_page')),
  url           text,        -- usado quando type = 'external_url'
  anchor        text,        -- usado quando type = 'anchor' (id de uma seção na Home)
  path          text,        -- usado quando type = 'internal_page' (rota existente, ex: /blog)
  open_new_tab  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.menu_items enable row level security;

create policy "menu_items_select_active" on public.menu_items
  for select using (is_active = true or auth.role() = 'authenticated');

create policy "menu_items_write_auth" on public.menu_items
  for all using (auth.role() = 'authenticated');

-- Dados iniciais, apontando para as seções/rotas reais do site atual
insert into public.menu_items (label, order_index, type, anchor, url, path, open_new_tab) values
  ('Home',                  0, 'anchor',       'hero',       null, null,                    false),
  ('Quem Somos',            1, 'anchor',       'grupo',      null, null,                    false),
  ('Associados',            2, 'anchor',       'associados', null, null,                    false),
  ('Parceiros',             3, 'anchor',       'parceiros',  null, null,                    false),
  ('EAD',                   4, 'external_url', null,         'https://ead.grupogcasa.com.br/', null, true),
  ('Blog',                  5, 'internal_page', null,        null, '/blog',                 false),
  ('Quero me Associar',     6, 'internal_page', null,        null, '/quero-me-associar',    false),
  ('Quero ser Fornecedor',  7, 'internal_page', null,        null, '/sou-fornecedor',       false),
  ('Fale Conosco',          8, 'anchor',       'contato',    null, null,                    false)
on conflict do nothing;
