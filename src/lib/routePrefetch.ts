// Registro de imports dinâmicos das páginas públicas, usados tanto pelo lazy()
// do router quanto para pré-carregar o chunk de uma rota ao passar o mouse/foco
// em um link (evita a espera perceptível no primeiro clique em páginas raras, ex. Blog).
export const publicRouteImports = {
  '/': () => import('@/pages/public/Home'),
  '/quem-somos': () => import('@/pages/public/QuemSomos'),
  '/associados': () => import('@/pages/public/Associados'),
  '/eventos': () => import('@/pages/public/Eventos'),
  '/fornecedores': () => import('@/pages/public/Fornecedores'),
  '/blog': () => import('@/pages/public/Blog'),
  '/contato': () => import('@/pages/public/Contato'),
  '/quero-me-associar': () => import('@/pages/public/QueroMeAssociar'),
  '/sou-fornecedor': () => import('@/pages/public/SouFornecedor'),
  '/estatuto': () => import('@/pages/public/Estatuto'),
  '/codigo-etica': () => import('@/pages/public/CodigoEtica'),
} satisfies Record<string, () => Promise<unknown>>

const prefetched = new Set<string>()

export function prefetchRoute(path: string) {
  const load = publicRouteImports[path as keyof typeof publicRouteImports]
  if (!load || prefetched.has(path)) return
  prefetched.add(path)
  load().catch(() => prefetched.delete(path))
}
