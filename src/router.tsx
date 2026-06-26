import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'

const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

const wrap = (Component: React.ComponentType) => (
  <Suspense fallback={<PageSpinner />}>
    <Component />
  </Suspense>
)

// ── Public pages ──────────────────────────────────────────────────────────────
const PublicLayout = lazy(() => import('@/components/layout/PublicLayout'))
const Home = lazy(() => import('@/pages/public/Home'))
const QuemSomos = lazy(() => import('@/pages/public/QuemSomos'))
const Associados = lazy(() => import('@/pages/public/Associados'))
const AssociadoDetalhe = lazy(() => import('@/pages/public/AssociadoDetalhe'))
const Eventos = lazy(() => import('@/pages/public/Eventos'))
const EventoDetalhe = lazy(() => import('@/pages/public/EventoDetalhe'))
const Fornecedores = lazy(() => import('@/pages/public/Fornecedores'))
const Blog = lazy(() => import('@/pages/public/Blog'))
const BlogPost = lazy(() => import('@/pages/public/BlogPost'))
const Contato = lazy(() => import('@/pages/public/Contato'))
const QueroMeAssociar = lazy(() => import('@/pages/public/QueroMeAssociar'))
const SouFornecedor = lazy(() => import('@/pages/public/SouFornecedor'))

// ── Admin pages ───────────────────────────────────────────────────────────────
const AdminLogin = lazy(() => import('@/pages/admin/Login'))
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const HomeEditor = lazy(() => import('@/pages/admin/HomeEditor'))
const AdminAssociados = lazy(() => import('@/pages/admin/Associados'))
const AdminFornecedores = lazy(() => import('@/pages/admin/Fornecedores'))
const AdminEventos = lazy(() => import('@/pages/admin/Eventos'))
const AdminBlog = lazy(() => import('@/pages/admin/Blog'))
const AdminDepoimentos = lazy(() => import('@/pages/admin/Depoimentos'))
const AdminParceiros = lazy(() => import('@/pages/admin/Parceiros'))
const AdminGaleria = lazy(() => import('@/pages/admin/Galeria'))
const AdminFormularios = lazy(() => import('@/pages/admin/Formularios'))
const AdminUsuarios = lazy(() => import('@/pages/admin/Usuarios'))
const AdminConfiguracoes = lazy(() => import('@/pages/admin/Configuracoes'))
const AdminBanners = lazy(() => import('@/pages/admin/Banners'))

export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSpinner />}>
        <PublicLayout>
          <Outlet />
        </PublicLayout>
      </Suspense>
    ),
    children: [
      { index: true, element: wrap(Home) },
      { path: 'quem-somos', element: wrap(QuemSomos) },
      { path: 'associados', element: wrap(Associados) },
      { path: 'associados/:slug', element: wrap(AssociadoDetalhe) },
      { path: 'eventos', element: wrap(Eventos) },
      { path: 'eventos/:slug', element: wrap(EventoDetalhe) },
      { path: 'fornecedores', element: wrap(Fornecedores) },
      { path: 'blog', element: wrap(Blog) },
      { path: 'blog/:slug', element: wrap(BlogPost) },
      { path: 'contato', element: wrap(Contato) },
      { path: 'quero-me-associar', element: wrap(QueroMeAssociar) },
      { path: 'sou-fornecedor', element: wrap(SouFornecedor) },
    ],
  },

  // ── Admin Login ───────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: wrap(AdminLogin),
  },

  // ── Admin (protected) ─────────────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageSpinner />}>
          <AdminLayout>
            <Outlet />
          </AdminLayout>
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: wrap(Dashboard) },
      { path: 'home', element: wrap(HomeEditor) },
      { path: 'banners', element: wrap(AdminBanners) },
      { path: 'associados', element: wrap(AdminAssociados) },
      { path: 'fornecedores', element: wrap(AdminFornecedores) },
      { path: 'eventos', element: wrap(AdminEventos) },
      { path: 'blog', element: wrap(AdminBlog) },
      { path: 'depoimentos', element: wrap(AdminDepoimentos) },
      { path: 'parceiros', element: wrap(AdminParceiros) },
      { path: 'galeria', element: wrap(AdminGaleria) },
      { path: 'formularios', element: wrap(AdminFormularios) },
      {
        path: 'usuarios',
        element: (
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageSpinner />}>
              <AdminUsuarios />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      { path: 'configuracoes', element: wrap(AdminConfiguracoes) },
    ],
  },
])
