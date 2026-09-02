-- Página rica de detalhes do associado: contato completo, endereço e múltiplas unidades/filiais.
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new

alter table public.associates
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists business_hours text;

create table if not exists public.associate_branches (
  id               uuid primary key default gen_random_uuid(),
  associate_id     uuid not null references public.associates(id) on delete cascade,
  name             text not null,
  is_hq            boolean default false,
  phone            text,
  whatsapp         text,
  address          text,
  city             text,
  state            text default 'SP',
  cep              text,
  latitude         numeric,
  longitude        numeric,
  business_hours   text,
  cover_image_url  text,
  gallery          jsonb default '[]',
  active           boolean default true,
  order_index      integer default 0,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

drop trigger if exists associate_branches_updated_at on public.associate_branches;
create trigger associate_branches_updated_at
  before update on public.associate_branches
  for each row execute procedure public.set_updated_at();

alter table public.associate_branches enable row level security;

drop policy if exists "associate_branches_select_active" on public.associate_branches;
create policy "associate_branches_select_active" on public.associate_branches
  for select using (active = true or auth.role() = 'authenticated');

drop policy if exists "associate_branches_write_auth" on public.associate_branches;
create policy "associate_branches_write_auth" on public.associate_branches
  for all using (auth.role() = 'authenticated');
