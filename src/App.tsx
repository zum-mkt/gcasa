import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persistOptions } from '@/lib/queryClient'
import { router } from '@/router'
import { ToastProvider } from '@/components/ui/Toast'

export default function App() {
  useEffect(() => {
    // App montou com sucesso — limpa a trava de "já tentei recarregar por
    // chunk desatualizado" (ver RouteErrorBoundary) pra que um deploy futuro
    // possa disparar o auto-reload de novo nesta mesma aba.
    sessionStorage.removeItem('gcasa:chunk-reload-attempted')
  }, [])

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ToastProvider />
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  )
}
