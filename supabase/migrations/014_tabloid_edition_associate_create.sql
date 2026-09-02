-- Associado nunca pode ficar travado sem nenhum tabloide aberto pra
-- trabalhar: se um admin apagar/fechar a edição em uso, o associado precisa
-- conseguir criar uma nova sozinho, sem depender do admin. Criar edição deixa
-- de ser exclusivo do admin (exclusão continua sendo, por ser destrutiva —
-- apaga em cascata os produtos de todo mundo).

drop policy if exists "tabloid_editions_insert_admin" on public.tabloid_editions;
create policy "tabloid_editions_insert_auth" on public.tabloid_editions
  for insert with check (auth.role() = 'authenticated');
