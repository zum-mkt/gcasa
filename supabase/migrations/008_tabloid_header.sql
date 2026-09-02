-- Imagem de cabeçalho por edição do tabloide (banner do topo da página 1, 21x8cm).

alter table public.tabloid_editions
  add column if not exists header_image_url text;
