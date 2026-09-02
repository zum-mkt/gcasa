import { QueryClient } from '@tanstack/react-query'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Chaves de queries do site público (sem dados sensíveis de admin) que podem
// ir para o localStorage para aparecer instantaneamente em novas visitas,
// em vez do texto/logo padrão enquanto o Supabase responde.
const PERSISTED_QUERY_KEYS = new Set([
  'home-hero',
  'home-stats',
  'header-site-settings',
  'footer-settings',
  'top-banners',
  'about-home',
  'benefits-home',
  'associates-home',
  'events-home',
  'partners-home',
  'testimonials-home',
  'blog-home',
  'cta-home',
  'quem-somos-content',
  'associates-public',
  'site-settings-contact',
  'blog-public',
  'suppliers-public',
  'blog-post',
])

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'gcasa-query-cache',
})

export const persistOptions = {
  persister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
      query.state.status === 'success' && PERSISTED_QUERY_KEYS.has(query.queryKey[0] as string),
  },
}
