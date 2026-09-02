import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, ScrollRestoration } from 'react-router-dom'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import RouteErrorBoundary from '@/components/RouteErrorBoundary'
import { publicRouteImports } from '@/lib/routePrefetch'

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
const Home = lazy(publicRouteImports['/'])
const QuemSomos = lazy(publicRouteImports['/quem-somos'])
const Associados = lazy(publicRouteImports['/associados'])
const AssociadoDetalhe = lazy(() => import('@/pages/public/AssociadoDetalhe'))
const Eventos = lazy(publicRouteImports['/eventos'])
const EventoDetalhe = lazy(() => import('@/pages/public/EventoDetalhe'))
const Fornecedores = lazy(publicRouteImports['/fornecedores'])
const Blog = lazy(publicRouteImports['/blog'])
const BlogPost = lazy(() => import('@/pages/public/BlogPost'))
const Contato = lazy(publicRouteImports['/contato'])
const QueroMeAssociar = lazy(publicRouteImports['/quero-me-associar'])
const SouFornecedor = lazy(publicRouteImports['/sou-fornecedor'])
const Estatuto = lazy(publicRouteImports['/estatuto'])
const CodigoEtica = lazy(publicRouteImports['/codigo-etica'])

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
const AdminMenu = lazy(() => import('@/pages/admin/Menu'))
const AdminPaginas = lazy(() => import('@/pages/admin/Paginas'))
const AdminTabloides = lazy(() => import('@/pages/admin/Tabloides'))
const AdminTabloidePreview = lazy(() => import('@/pages/admin/Tabloides/Preview'))

// ── Portal do associado ──────────────────────────────────────────────────────
const PortalLayout = lazy(() => import('@/components/portal/PortalLayout'))
const PortalProdutos = lazy(() => import('@/pages/portal/Produtos'))

export const router = createBrowserRouter([
  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSpinner />}>
        <PublicLayout>
          <Outlet />
        </PublicLayout>
        <ScrollRestoration />
      </Suspense>
    ),
    errorElement: <RouteErrorBoundary />,
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
      { path: 'estatuto', element: wrap(Estatuto) },
      { path: 'codigo-etica', element: wrap(CodigoEtica) },
    ],
  },

  // ── Admin Login ───────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: wrap(AdminLogin),
    errorElement: <RouteErrorBoundary />,
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
          <ScrollRestoration />
        </Suspense>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'dashboard', element: wrap(Dashboard) },
      { path: 'home', element: wrap(HomeEditor) },
      { path: 'banners', element: wrap(AdminBanners) },
      { path: 'menu', element: wrap(AdminMenu) },
      { path: 'paginas', element: wrap(AdminPaginas) },
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
      { path: 'tabloides', element: wrap(AdminTabloides) },
    ],
  },

  // ── Preview/impressão do tabloide — fora do AdminLayout (sem sidebar), pra imprimir limpo ──
  {
    path: '/admin/tabloides/:id/preview',
    element: (
      <ProtectedRoute>
        {wrap(AdminTabloidePreview)}
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
  },

  // ── Portal do associado — login (mesma tela de /admin, redireciona por role) ─
  {
    path: '/portal',
    element: wrap(AdminLogin),
    errorElement: <RouteErrorBoundary />,
  },

  // ── Portal do associado (protegido) ──────────────────────────────────────────
  {
    path: '/portal',
    element: (
      <ProtectedRoute requireAssociate>
        <Suspense fallback={<PageSpinner />}>
          <PortalLayout>
            <Outlet />
          </PortalLayout>
          <ScrollRestoration />
        </Suspense>
      </ProtectedRoute>
    ),
    // Sem rota `index` de propósito — o React Router não lida bem com duas rotas
    // irmãs no mesmo path literal ('/portal') quando uma delas tem `index`, o que
    // causava "Maximum call stack size exceeded" num redirect vindo de dentro da
    // árvore protegida. `/portal` (path exato) sempre bate só com a rota de login;
    // a área logada só existe a partir de `/portal/produtos`.
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: 'produtos', element: wrap(PortalProdutos) },
    ],
  },
])
