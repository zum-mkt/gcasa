-- Associado ganha acesso completo pra EDITAR a edição do tabloide (nome,
-- status, prazos, validade, cabeçalho, rodapé/letras miúdas, observações) —
-- pedido explícito do usuário, mesmo com várias lojas compartilhando a
-- mesma edição. Criar e excluir edições continua só admin (ações
-- estruturais/destrutivas — excluir cascade apaga os produtos de todo mundo).

drop policy if exists "tabloid_editions_write_admin" on public.tabloid_editions;

drop policy if exists "tabloid_editions_insert_admin" on public.tabloid_editions;
create policy "tabloid_editions_insert_admin" on public.tabloid_editions
  for insert with check (public.is_admin());

drop policy if exists "tabloid_editions_update_auth" on public.tabloid_editions;
create policy "tabloid_editions_update_auth" on public.tabloid_editions
  for update using (auth.role() = 'authenticated');

drop policy if exists "tabloid_editions_delete_admin" on public.tabloid_editions;
create policy "tabloid_editions_delete_admin" on public.tabloid_editions
  for delete using (public.is_admin());
