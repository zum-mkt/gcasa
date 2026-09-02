import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  /** Gate pra área do associado (`/portal`) — exige role === 'associate' em vez de admin/editor. */
  requireAssociate?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false, requireAssociate = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isAssociate, isLoading, isInitialized } = useAuth()
  const location = useLocation()

  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={requireAssociate ? '/portal' : '/admin'} state={{ from: location }} replace />
  }

  // O painel admin (dashboard, tabloides, etc.) é só pra admin/editor — antes só
  // '/admin/usuarios' tinha um gate de papel, então um associado que caísse em
  // qualquer outra rota de /admin (ex.: race de redirecionamento no login, ou
  // link direto) via o painel inteiro em vez de ser mandado pro portal dele.
  if (!requireAssociate && isAssociate) {
    return <Navigate to="/portal/produtos" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (requireAssociate && !isAssociate) {
    return <Navigate to="/portal" replace />
  }

  return <>{children}</>
}
