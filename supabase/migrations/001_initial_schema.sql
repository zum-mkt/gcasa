-- ============================================================
-- GRUPO GCASA — Migração Inicial
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- RESET: remove tudo antes de recriar (seguro para dev)
-- ============================================================
drop table if exists public.activity_logs       cascade;
drop table if exists public.seo_settings        cascade;
drop table if exists public.form_submissions    cascade;
drop table if exists public.media_files         cascade;
drop table if exists public.gallery_items       cascade;
drop table if exists public.galleries           cascade;
drop table if exists public.partners            cascade;
drop table if exists public.testimonials        cascade;
drop table if exists public.blog_posts          cascade;
drop table if exists public.events              cascade;
drop table if exists public.suppliers           cascade;
drop table if exists public.associates          cascade;
drop table if exists public.categories          cascade;
drop table if exists public.pages               cascade;
drop table if exists public.home_content        cascade;
drop table if exists public.settings            cascade;
drop table if exists public.profiles            cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at()  cascade;

-- ============================================================
-- Extensões necessárias
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles (vinculada a auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  role        text not null default 'editor' check (role in ('admin', 'editor')),
  name        text,
  avatar_url  text,
  last_sign_in_at timestamptz,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

-- Trigger: cria perfil automaticamente quando um usuário é criado
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: atualiza updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: settings
-- ============================================================
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz default now() not null
);

-- Dados iniciais das configurações
insert into public.settings (key, value) values
  ('site', '{"company_name": "Grupo GCasa", "tagline": "Construindo empresas mais fortes através da colaboração.", "phone": "(16) 3361-0000", "email": "contato@grupogcasa.com.br", "address": "Rua João Perfeado, 2237", "address_city": "São Carlos", "address_state": "SP", "address_cep": "13560-660", "whatsapp": "5514998237508"}'::jsonb),
  ('social', '{"instagram": "", "facebook": "", "linkedin": "", "youtube": ""}'::jsonb),
  ('seo', '{"default_title": "Grupo GCasa — Rede Empresarial do Setor de Construção", "default_description": "O Grupo GCasa reúne empresários do setor de materiais de construção para gerar desenvolvimento, compartilhar conhecimento e fortalecer resultados."}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- TABELA: home_content
-- ============================================================
create table if not exists public.home_content (
  id          uuid primary key default uuid_generate_v4(),
  section     text not null unique,
  content     jsonb not null default '{}',
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz default now() not null
);

-- Dados iniciais da Home
insert into public.home_content (section, content) values
  ('hero', '{
    "tag": "REDE EMPRESARIAL DO SETOR DE CONSTRUÇÃO",
    "title": "Construindo empresas mais fortes através da",
    "title_highlight": "colaboração.",
    "description": "O Grupo GCasa reúne empresários do setor de materiais de construção para gerar desenvolvimento, compartilhar conhecimento e fortalecer resultados.",
    "cta_primary_label": "Quero me Associar",
    "cta_primary_href": "/quero-me-associar",
    "cta_secondary_label": "Conheça o Grupo",
    "cta_secondary_href": "/quem-somos",
    "stats": [
      {"icon": "store", "value": "+18", "label": "lojas"},
      {"icon": "building", "value": "+10", "label": "empresas"},
      {"icon": "users", "value": "+700", "label": "colaboradores"}
    ]
  }'::jsonb),
  ('stats', '{
    "items": [
      {"value": "10", "label": "Empresas Associadas", "suffix": "+"},
      {"value": "18", "label": "Lojas"},
      {"value": "700", "label": "Colaboradores", "suffix": "+"},
      {"value": "12", "label": "Anos de História", "suffix": "+"},
      {"value": "Milhões", "label": "Em compras anuais"}
    ]
  }'::jsonb),
  ('about', '{
    "tag": "NOSSO PROPÓSITO",
    "title": "Crescemos quando crescemos",
    "title_highlight": "juntos.",
    "description": "A união de empresários fortes cria um ecossistema que gera desenvolvimento, inovação e novas oportunidades para todos.",
    "image_url": null
  }'::jsonb),
  ('benefits', '{
    "tag": "BENEFÍCIOS",
    "title": "Vantagens reais para associados.",
    "items": [
      {"icon": "BarChart2", "title": "Inteligência de Mercado", "description": "Acesso a dados, indicadores e análises exclusivas do setor."},
      {"icon": "Users", "title": "Networking Estratégico", "description": "Conexão com empresários e líderes do mercado."},
      {"icon": "Handshake", "title": "Poder de Negociação", "description": "Melhores condições comerciais junto aos fornecedores."},
      {"icon": "GraduationCap", "title": "Capacitação", "description": "Treinamentos, workshops e programas de desenvolvimento."},
      {"icon": "Lightbulb", "title": "Inovação", "description": "Acesso a novas soluções, tecnologias e metodologias."},
      {"icon": "TrendingUp", "title": "Gestão e Performance", "description": "Ferramentas e suporte para evolução dos resultados."}
    ]
  }'::jsonb),
  ('cta', '{
    "title": "Sua empresa está pronta para crescer junto com a gente?",
    "description": "Faça parte da maior rede colaborativa do setor de materiais de construção do interior paulista.",
    "cta_primary_label": "Quero me Associar",
    "cta_primary_href": "/quero-me-associar",
    "cta_secondary_label": "Falar com um especialista",
    "cta_secondary_href": "/contato"
  }'::jsonb)
on conflict (section) do nothing;

-- ============================================================
-- TABELA: pages
-- ============================================================
create table if not exists public.pages (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  title       text not null,
  content     jsonb default '{}',
  seo         jsonb default '{}',
  published   boolean default true,
  updated_by  uuid references public.profiles(id),
  updated_at  timestamptz default now() not null
);

insert into public.pages (slug, title) values
  ('quem-somos', 'Quem Somos'),
  ('contato', 'Fale Conosco')
on conflict (slug) do nothing;

-- ============================================================
-- TABELA: categories
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  type        text not null check (type in ('blog', 'event', 'associate', 'supplier')),
  created_at  timestamptz default now() not null
);

insert into public.categories (name, slug, type) values
  ('Mercado', 'mercado', 'blog'),
  ('Gestão', 'gestao', 'blog'),
  ('Eventos', 'eventos', 'blog'),
  ('Cases', 'cases', 'blog'),
  ('Convenção', 'convencao', 'event'),
  ('Missão Técnica', 'missao-tecnica', 'event'),
  ('Capacitação', 'capacitacao', 'event'),
  ('Home Center', 'home-center', 'associate'),
  ('Materiais de Construção', 'materiais-construcao', 'associate')
on conflict (slug) do nothing;

-- ============================================================
-- TABELA: associates
-- ============================================================
create table if not exists public.associates (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  logo_url        text,
  city            text,
  state           text default 'SP',
  description     text,
  site_url        text,
  instagram       text,
  facebook        text,
  whatsapp        text,
  store_image_url text,
  gallery         jsonb default '[]',
  category_id     uuid references public.categories(id),
  active          boolean default true,
  order_index     integer default 0,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

drop trigger if exists associates_updated_at on public.associates;
create trigger associates_updated_at
  before update on public.associates
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: suppliers
-- ============================================================
create table if not exists public.suppliers (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  logo_url      text,
  description   text,
  site_url      text,
  contact_email text,
  contact_phone text,
  category_id   uuid references public.categories(id),
  gallery       jsonb default '[]',
  active        boolean default true,
  featured      boolean default false,
  order_index   integer default 0,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

drop trigger if exists suppliers_updated_at on public.suppliers;
create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: events
-- ============================================================
create table if not exists public.events (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  slug        text not null unique,
  date        timestamptz not null,
  location    text,
  description text,
  content     jsonb default '{}',
  image_url   text,
  gallery     jsonb default '[]',
  videos      jsonb default '[]',
  files       jsonb default '[]',
  status      text default 'published' check (status in ('draft', 'published', 'archived')),
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at
  before update on public.events
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: blog_posts
-- ============================================================
create table if not exists public.blog_posts (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  slug         text not null unique,
  excerpt      text,
  content      jsonb default '{}',
  cover_url    text,
  seo          jsonb default '{}',
  category_id  uuid references public.categories(id),
  tags         text[] default '{}',
  author_id    uuid references public.profiles(id),
  published_at timestamptz,
  status       text default 'draft' check (status in ('draft', 'published', 'archived')),
  read_time    integer,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

drop trigger if exists blog_posts_updated_at on public.blog_posts;
create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- TABELA: testimonials
-- ============================================================
create table if not exists public.testimonials (
  id          uuid primary key default uuid_generate_v4(),
  avatar_url  text,
  author_name text not null,
  company     text,
  author_role text,
  text        text not null,
  rating      integer default 5 check (rating between 1 and 5),
  order_index integer default 0,
  active      boolean default true,
  created_at  timestamptz default now() not null
);

-- Dados iniciais
insert into public.testimonials (author_name, company, author_role, text, rating, order_index)
select 'Douglas Pontes Castilho', 'Santa Helena Home Center', 'Diretor',
  'Sou um dos fundadores do Gcasa. O Grupo foi essencial para minha empresa crescer e se desenvolver. A troca de experiência entre os Associados é enriquecedora. Vislumbro grande possibilidade de crescimento, através do potencial transformador dos colaboradores, com ótima sinergia e relacionamento com os fornecedores.',
  5, 0
where not exists (select 1 from public.testimonials where author_name = 'Douglas Pontes Castilho');

-- ============================================================
-- TABELA: partners
-- ============================================================
create table if not exists public.partners (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  site_url    text,
  order_index integer default 0,
  active      boolean default true,
  created_at  timestamptz default now() not null
);

-- ============================================================
-- TABELA: galleries
-- ============================================================
create table if not exists public.galleries (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now() not null
);

-- ============================================================
-- TABELA: gallery_items
-- ============================================================
create table if not exists public.gallery_items (
  id          uuid primary key default uuid_generate_v4(),
  gallery_id  uuid references public.galleries(id) on delete cascade,
  file_url    text not null,
  file_type   text default 'image',
  alt         text,
  order_index integer default 0,
  created_at  timestamptz default now() not null
);

-- ============================================================
-- TABELA: media_files
-- ============================================================
create table if not exists public.media_files (
  id          uuid primary key default uuid_generate_v4(),
  url         text not null,
  name        text not null,
  size        integer,
  type        text,
  bucket      text default 'media',
  uploaded_by uuid references public.profiles(id),
  created_at  timestamptz default now() not null
);

-- ============================================================
-- TABELA: form_submissions
-- ============================================================
create table if not exists public.form_submissions (
  id          uuid primary key default uuid_generate_v4(),
  form_type   text not null check (form_type in ('contact', 'associate', 'supplier', 'work')),
  data        jsonb not null default '{}',
  email_sent  boolean default false,
  read        boolean default false,
  ip_address  text,
  created_at  timestamptz default now() not null
);

-- ============================================================
-- TABELA: seo_settings
-- ============================================================
create table if not exists public.seo_settings (
  page             text primary key,
  meta_title       text,
  meta_description text,
  og_image         text,
  canonical        text,
  noindex          boolean default false,
  schema           jsonb default '{}',
  updated_at       timestamptz default now() not null
);

-- ============================================================
-- TABELA: activity_logs
-- ============================================================
create table if not exists public.activity_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id),
  action      text not null,
  entity      text,
  entity_id   text,
  metadata    jsonb default '{}',
  created_at  timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.home_content enable row level security;
alter table public.pages enable row level security;
alter table public.categories enable row level security;
alter table public.associates enable row level security;
alter table public.suppliers enable row level security;
alter table public.events enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.partners enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_items enable row level security;
alter table public.media_files enable row level security;
alter table public.form_submissions enable row level security;
alter table public.seo_settings enable row level security;
alter table public.activity_logs enable row level security;

-- ── PROFILES ─────────────────────────────────────────────────
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── SETTINGS ─────────────────────────────────────────────────
drop policy if exists "settings_select_public" on public.settings;
create policy "settings_select_public" on public.settings
  for select using (true);

drop policy if exists "settings_write_auth" on public.settings;
create policy "settings_write_auth" on public.settings
  for all using (auth.role() = 'authenticated');

-- ── HOME CONTENT ─────────────────────────────────────────────
drop policy if exists "home_content_select_public" on public.home_content;
create policy "home_content_select_public" on public.home_content
  for select using (true);

drop policy if exists "home_content_write_auth" on public.home_content;
create policy "home_content_write_auth" on public.home_content
  for all using (auth.role() = 'authenticated');

-- ── PAGES ────────────────────────────────────────────────────
drop policy if exists "pages_select_published" on public.pages;
create policy "pages_select_published" on public.pages
  for select using (published = true or auth.role() = 'authenticated');

drop policy if exists "pages_write_auth" on public.pages;
create policy "pages_write_auth" on public.pages
  for all using (auth.role() = 'authenticated');

-- ── CATEGORIES ───────────────────────────────────────────────
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
  for select using (true);

drop policy if exists "categories_write_auth" on public.categories;
create policy "categories_write_auth" on public.categories
  for all using (auth.role() = 'authenticated');

-- ── ASSOCIATES ───────────────────────────────────────────────
drop policy if exists "associates_select_active" on public.associates;
create policy "associates_select_active" on public.associates
  for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "associates_write_auth" on public.associates;
create policy "associates_write_auth" on public.associates
  for all using (auth.role() = 'authenticated');

-- ── SUPPLIERS ────────────────────────────────────────────────
drop policy if exists "suppliers_select_active" on public.suppliers;
create policy "suppliers_select_active" on public.suppliers
  for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "suppliers_write_auth" on public.suppliers;
create policy "suppliers_write_auth" on public.suppliers
  for all using (auth.role() = 'authenticated');

-- ── EVENTS ───────────────────────────────────────────────────
drop policy if exists "events_select_published" on public.events;
create policy "events_select_published" on public.events
  for select using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "events_write_auth" on public.events;
create policy "events_write_auth" on public.events
  for all using (auth.role() = 'authenticated');

-- ── BLOG POSTS ───────────────────────────────────────────────
drop policy if exists "blog_posts_select_published" on public.blog_posts;
create policy "blog_posts_select_published" on public.blog_posts
  for select using (status = 'published' or auth.role() = 'authenticated');

drop policy if exists "blog_posts_write_auth" on public.blog_posts;
create policy "blog_posts_write_auth" on public.blog_posts
  for all using (auth.role() = 'authenticated');

-- ── TESTIMONIALS ─────────────────────────────────────────────
drop policy if exists "testimonials_select_active" on public.testimonials;
create policy "testimonials_select_active" on public.testimonials
  for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "testimonials_write_auth" on public.testimonials;
create policy "testimonials_write_auth" on public.testimonials
  for all using (auth.role() = 'authenticated');

-- ── PARTNERS ─────────────────────────────────────────────────
drop policy if exists "partners_select_active" on public.partners;
create policy "partners_select_active" on public.partners
  for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "partners_write_auth" on public.partners;
create policy "partners_write_auth" on public.partners
  for all using (auth.role() = 'authenticated');

-- ── GALLERIES ────────────────────────────────────────────────
drop policy if exists "galleries_select_public" on public.galleries;
create policy "galleries_select_public" on public.galleries
  for select using (true);

drop policy if exists "galleries_write_auth" on public.galleries;
create policy "galleries_write_auth" on public.galleries
  for all using (auth.role() = 'authenticated');

-- ── GALLERY ITEMS ────────────────────────────────────────────
drop policy if exists "gallery_items_select_public" on public.gallery_items;
create policy "gallery_items_select_public" on public.gallery_items
  for select using (true);

drop policy if exists "gallery_items_write_auth" on public.gallery_items;
create policy "gallery_items_write_auth" on public.gallery_items
  for all using (auth.role() = 'authenticated');

-- ── MEDIA FILES ──────────────────────────────────────────────
drop policy if exists "media_files_write_auth" on public.media_files;
create policy "media_files_write_auth" on public.media_files
  for all using (auth.role() = 'authenticated');

-- ── FORM SUBMISSIONS ─────────────────────────────────────────
drop policy if exists "form_submissions_insert_public" on public.form_submissions;
create policy "form_submissions_insert_public" on public.form_submissions
  for insert with check (true);

drop policy if exists "form_submissions_select_auth" on public.form_submissions;
create policy "form_submissions_select_auth" on public.form_submissions
  for select using (auth.role() = 'authenticated');

drop policy if exists "form_submissions_update_auth" on public.form_submissions;
create policy "form_submissions_update_auth" on public.form_submissions
  for update using (auth.role() = 'authenticated');

drop policy if exists "form_submissions_delete_auth" on public.form_submissions;
create policy "form_submissions_delete_auth" on public.form_submissions
  for delete using (auth.role() = 'authenticated');

-- ── SEO SETTINGS ─────────────────────────────────────────────
drop policy if exists "seo_select_public" on public.seo_settings;
create policy "seo_select_public" on public.seo_settings
  for select using (true);

drop policy if exists "seo_write_auth" on public.seo_settings;
create policy "seo_write_auth" on public.seo_settings
  for all using (auth.role() = 'authenticated');

-- ── ACTIVITY LOGS ────────────────────────────────────────────
drop policy if exists "activity_logs_insert_auth" on public.activity_logs;
create policy "activity_logs_insert_auth" on public.activity_logs
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "activity_logs_select_auth" on public.activity_logs;
create policy "activity_logs_select_auth" on public.activity_logs
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Policy: upload autenticado, leitura pública
drop policy if exists "media_insert_auth" on storage.objects;
create policy "media_insert_auth" on storage.objects
  for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "media_select_public" on storage.objects;
create policy "media_select_public" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media_delete_auth" on storage.objects;
create policy "media_delete_auth" on storage.objects
  for delete using (bucket_id = 'media' and auth.role() = 'authenticated');

drop policy if exists "avatars_insert_auth" on storage.objects;
create policy "avatars_insert_auth" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_associates_active_order on public.associates (active, order_index);
create index if not exists idx_associates_slug on public.associates (slug);
create index if not exists idx_suppliers_active_order on public.suppliers (active, order_index);
create index if not exists idx_suppliers_slug on public.suppliers (slug);
create index if not exists idx_events_status_date on public.events (status, date desc);
create index if not exists idx_events_slug on public.events (slug);
create index if not exists idx_blog_posts_status_published on public.blog_posts (status, published_at desc);
create index if not exists idx_blog_posts_slug on public.blog_posts (slug);
create index if not exists idx_blog_posts_category on public.blog_posts (category_id);
create index if not exists idx_partners_active_order on public.partners (active, order_index);
create index if not exists idx_testimonials_active_order on public.testimonials (active, order_index);
create index if not exists idx_form_submissions_type_date on public.form_submissions (form_type, created_at desc);
create index if not exists idx_form_submissions_read on public.form_submissions (read);
create index if not exists idx_activity_logs_user_date on public.activity_logs (user_id, created_at desc);
