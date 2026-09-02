-- A policy "profiles_select_admin" consulta a própria tabela public.profiles
-- dentro do seu USING, o que causa "infinite recursion detected in policy for
-- relation profiles" em qualquer select que dependa das policies de profiles
-- (inclusive o join author:profiles(...) usado na listagem do Blog no admin).
--
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/mpchsfmhwlcekblrcawm/sql/new
--
-- Fix: mover a checagem de admin para uma função security definer, que roda
-- com privilégios do dono da função (bypassa RLS) e não reentra na policy.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());
