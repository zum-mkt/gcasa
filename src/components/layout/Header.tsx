import { useState, type ReactNode, type FocusEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Menu, X, ChevronDown, ExternalLink } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useScrolled } from '@/hooks/useScrollAnimation'
import { useMenuItems } from '@/hooks/useMenuItems'
import { prefetchRoute } from '@/lib/routePrefetch'
import { buildMenuTree, itemIsCurrent, nodeIsActive, parseInternalPath } from '@/lib/menuTree'
import type { MenuItem, MenuNode } from '@/types/menu'

const SvgInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
)
const SvgFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)

async function fetchSiteSettings() {
  const { data } = await supabase.from('settings').select('key, value').in('key', ['site', 'social'])
  const map: Record<string, Record<string, string>> = {}
  for (const row of data ?? []) map[row.key] = row.value as Record<string, string>
  return {
    site: (map.site ?? {}) as { company_name?: string; logo_url?: string },
    social: (map.social ?? {}) as { instagram?: string; facebook?: string },
  }
}

const fallback = (
  id: string,
  label: string,
  order_index: number,
  type: MenuItem['type'],
  dest: { path?: string | null; url?: string | null; anchor?: string | null; parent_id?: string | null; open_new_tab?: boolean },
): MenuItem => ({
  id,
  label,
  order_index,
  is_active: true,
  type,
  url: dest.url ?? null,
  anchor: dest.anchor ?? null,
  path: dest.path ?? null,
  open_new_tab: dest.open_new_tab ?? false,
  parent_id: dest.parent_id ?? null,
  created_at: '',
  updated_at: '',
})

/* Usado enquanto o menu_items ainda carrega, ou se a tabela estiver vazia. */
const FALLBACK_ITEMS: MenuItem[] = [
  fallback('g1', 'O Grupo', 0, 'internal_page', { path: '/quem-somos' }),
  fallback('g11', 'Quem Somos', 0, 'internal_page', { path: '/quem-somos', parent_id: 'g1' }),
  fallback('g12', 'Missão, Visão e Valores', 1, 'internal_page', { path: '/quem-somos#missao', parent_id: 'g1' }),
  fallback('g13', 'Nossa história', 2, 'internal_page', { path: '/quem-somos#historia', parent_id: 'g1' }),
  fallback('g14', 'Estatuto', 3, 'internal_page', { path: '/estatuto', parent_id: 'g1' }),
  fallback('g15', 'Código de Ética', 4, 'internal_page', { path: '/codigo-etica', parent_id: 'g1' }),

  fallback('a2', 'Associados', 1, 'internal_page', { path: '/associados' }),
  fallback('a21', 'Empresas associadas', 0, 'internal_page', { path: '/associados', parent_id: 'a2' }),
  fallback('a22', 'Benefícios', 1, 'internal_page', { path: '/quem-somos#beneficios', parent_id: 'a2' }),
  fallback('a23', 'Quero me associar', 2, 'internal_page', { path: '/quero-me-associar', parent_id: 'a2' }),
  fallback('a24', 'Área do associado', 3, 'internal_page', { path: '/portal', parent_id: 'a2' }),

  fallback('f3', 'Fornecedores', 2, 'internal_page', { path: '/fornecedores' }),
  fallback('f31', 'Rede de fornecedores', 0, 'internal_page', { path: '/fornecedores', parent_id: 'f3' }),
  fallback('f32', 'Quero ser fornecedor', 1, 'internal_page', { path: '/sou-fornecedor', parent_id: 'f3' }),

  fallback('e4', 'Eventos', 3, 'internal_page', { path: '/eventos' }),
  fallback('e41', 'Agenda de eventos', 0, 'internal_page', { path: '/eventos', parent_id: 'e4' }),
  fallback('e42', 'Plataforma EAD', 1, 'external_url', { url: 'https://ead.grupogcasa.com.br/', open_new_tab: true, parent_id: 'e4' }),

  fallback('b5', 'Blog', 4, 'internal_page', { path: '/blog' }),
  fallback('c6', 'Contato', 5, 'internal_page', { path: '/contato' }),
]

const HEADER_HEIGHT = 80

const topLinkClass = (active: boolean) =>
  cn(
    'px-3 py-2 text-base font-bold transition-colors whitespace-nowrap flex items-center gap-1',
    active ? 'text-primary-600' : 'text-graphite-800 hover:text-primary-600',
  )

const subLinkClass = (active: boolean) =>
  cn(
    'flex items-center justify-between gap-3 w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors',
    active ? 'bg-primary-50 text-primary-700' : 'text-graphite-800 hover:bg-primary-50 hover:text-primary-700',
  )

export function Header() {
  const isScrolled = useScrolled(20)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openMobileId, setOpenMobileId] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const { data: siteSettings, isPending: isSettingsPending } = useQuery({
    queryKey: ['header-site-settings'],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
  })
  const logoUrl      = siteSettings?.site?.logo_url ?? null
  const companyName  = siteSettings?.site?.company_name ?? 'Grupo GCasa'
  const instagramUrl = siteSettings?.social?.instagram ?? null
  const facebookUrl  = siteSettings?.social?.facebook ?? null

  const { data: dbMenuItems } = useMenuItems()
  const menuItems = dbMenuItems && dbMenuItems.length > 0 ? dbMenuItems : FALLBACK_ITEMS
  const tree = buildMenuTree(menuItems)

  const scrollTo = (sectionId: string) => {
    setIsMobileOpen(false)
    setOpenMobileId(null)

    const doScroll = () => {
      const el = document.getElementById(sectionId)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
      window.scrollTo({ top, behavior: 'smooth' })
    }

    if (location.pathname !== '/') {
      navigate({ pathname: '/', hash: `#${sectionId}` })
    } else {
      doScroll()
    }
  }

  const goToItem = (item: MenuItem) => {
    setIsMobileOpen(false)
    setOpenMobileId(null)

    if (item.type === 'anchor' && item.anchor) {
      scrollTo(item.anchor)
      return
    }
    if (item.type === 'internal_page' && item.path) {
      const { pathname, hash } = parseInternalPath(item.path)
      navigate({ pathname, hash })
    }
  }

  const prefetchItem = (item: MenuItem) => {
    if (item.type === 'internal_page' && item.path) prefetchRoute(item.path)
  }

  const goHome = () => {
    setIsMobileOpen(false)
    if (location.pathname !== '/') {
      navigate('/')
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/97 backdrop-blur-md border-b border-graphite-100 shadow-[0_1px_16px_rgba(0,0,0,0.05)]'
          : 'bg-white border-b border-graphite-100'
      )}
    >
      <div className="container-site">
        <div className="flex items-center justify-between h-[80px]">

          <button
            onClick={goHome}
            className="flex items-center gap-3 flex-shrink-0 focus:outline-none"
            aria-label="Ir para o início"
          >
            {isSettingsPending ? (
              <div className="w-8 h-8" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={companyName} style={{ height: 52, width: 'auto' }} />
            ) : (
              <>
                <div className="w-8 h-8 bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-graphite-900 font-bold text-sm">{companyName[0]}</span>
                </div>
                <span className="hidden sm:block text-sm font-semibold text-graphite-900 tracking-wide">{companyName}</span>
              </>
            )}
          </button>

          <nav className="hidden xl:flex items-center justify-end min-w-0 flex-1" aria-label="Principal">
            {tree.map((node) => (
              <DesktopItem
                key={node.item.id}
                node={node}
                pathname={location.pathname}
                hash={location.hash}
                tree={tree}
                onGo={goToItem}
                onPrefetch={prefetchItem}
              />
            ))}
          </nav>

          <div className="hidden xl:flex items-center gap-3 flex-shrink-0 ml-2">
            {(instagramUrl || facebookUrl) && (
              <div className="flex items-center gap-1.5 border-r border-graphite-200 pr-3 mr-0.5">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"
                    className="p-1.5 text-graphite-500 hover:text-primary-600 transition-colors">
                    <SvgInstagram />
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"
                    className="p-1.5 text-graphite-500 hover:text-primary-600 transition-colors">
                    <SvgFacebook />
                  </a>
                )}
              </div>
            )}
            <Link
              to="/quero-me-associar"
              className="px-7 py-3 text-base font-extrabold text-graphite-900 bg-primary-500 hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              Associar-se
            </Link>
          </div>

          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="xl:hidden p-2 text-graphite-600 transition-colors"
            aria-expanded={isMobileOpen}
            aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="xl:hidden bg-white border-t border-graphite-100 px-6 py-4 max-h-[calc(100vh-80px)] overflow-y-auto">
          <nav aria-label="Principal">
            {tree.map((node) => {
              const hasChildren = node.children.length > 0
              const expanded = openMobileId === node.item.id
              const active = nodeIsActive(node, location.pathname, tree)
              return (
                <div key={node.item.id} className="border-b border-graphite-50 last:border-0">
                  {hasChildren ? (
                    <>
                      <div className="flex items-center">
                        <button
                          onClick={() => goToItem(node.item)}
                          onTouchStart={() => prefetchItem(node.item)}
                          className={cn(
                            'flex-1 text-left py-3 text-lg font-bold transition-colors',
                            active ? 'text-primary-600' : 'text-graphite-800',
                          )}
                        >
                          {node.item.label}
                        </button>
                        <button
                          onClick={() => setOpenMobileId(expanded ? null : node.item.id)}
                          className="p-3 text-graphite-500"
                          aria-expanded={expanded}
                          aria-label={expanded ? `Recolher ${node.item.label}` : `Expandir ${node.item.label}`}
                        >
                          <ChevronDown size={18} className={cn('transition-transform', expanded && 'rotate-180')} />
                        </button>
                      </div>
                      {expanded && (
                        <div className="pb-2 pl-3 border-l-2 border-primary-500 ml-1 mb-2 space-y-0.5">
                          {node.children.map((child) => (
                            <MenuTarget
                              key={child.id}
                              item={child}
                              className="w-full text-left block py-2.5 text-base font-semibold text-graphite-700 hover:text-primary-600"
                              onGo={goToItem}
                              onPrefetch={prefetchItem}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <MenuTarget
                      item={node.item}
                      className={cn(
                        'w-full text-left block py-3 text-lg font-bold',
                        active ? 'text-primary-600' : 'text-graphite-800',
                      )}
                      onGo={goToItem}
                      onPrefetch={prefetchItem}
                    />
                  )}
                </div>
              )
            })}
          </nav>
          <div className="pt-4 space-y-2 mt-2">
            <Link
              to="/quero-me-associar"
              onClick={() => setIsMobileOpen(false)}
              className="w-full block py-4 text-lg font-extrabold text-graphite-900 bg-primary-500 text-center"
            >
              Associar-se
            </Link>
            {(instagramUrl || facebookUrl) && (
              <div className="flex items-center justify-center gap-4 pt-2">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"
                    className="flex items-center gap-1.5 text-xs text-graphite-400 hover:text-primary-600 transition-colors">
                    <SvgInstagram /> Instagram
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"
                    className="flex items-center gap-1.5 text-xs text-graphite-400 hover:text-primary-600 transition-colors">
                    <SvgFacebook /> Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function DesktopItem({
  node,
  pathname,
  hash,
  tree,
  onGo,
  onPrefetch,
}: {
  node: MenuNode
  pathname: string
  hash: string
  tree: MenuNode[]
  onGo: (item: MenuItem) => void
  onPrefetch: (item: MenuItem) => void
}) {
  const [open, setOpen] = useState(false)
  const active = nodeIsActive(node, pathname, tree)
  const hasChildren = node.children.length > 0

  const go = (item: MenuItem) => {
    setOpen(false)
    onGo(item)
  }

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
  }

  if (!hasChildren) {
    return (
      <MenuTarget
        item={node.item}
        className={topLinkClass(active)}
        onGo={go}
        onPrefetch={onPrefetch}
      />
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={onBlur}
    >
      <MenuTarget
        item={node.item}
        className={topLinkClass(active)}
        onGo={go}
        onPrefetch={onPrefetch}
        ariaHasPopup
        ariaExpanded={open}
      >
        {node.item.label}
        <ChevronDown size={14} className={cn('transition-transform duration-200', open && 'rotate-180')} />
      </MenuTarget>
      {open && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="bg-white border border-graphite-100 shadow-dropdown min-w-[240px] py-2" role="menu">
            {node.children.map((child) => (
              <MenuTarget
                key={child.id}
                item={child}
                className={subLinkClass(itemIsCurrent(child, pathname, hash))}
                onGo={go}
                onPrefetch={onPrefetch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MenuTarget({
  item,
  className,
  onGo,
  onPrefetch,
  children,
  ariaHasPopup,
  ariaExpanded,
}: {
  item: MenuItem
  className: string
  onGo: (item: MenuItem) => void
  onPrefetch: (item: MenuItem) => void
  children?: ReactNode
  ariaHasPopup?: boolean
  ariaExpanded?: boolean
}) {
  const label = children ?? (
    <>
      <span>{item.label}</span>
      {item.type === 'external_url' && (
        <ExternalLink size={12} className="opacity-50 flex-shrink-0" />
      )}
    </>
  )

  if (item.type === 'external_url' && item.url) {
    return (
      <a
        href={item.url}
        target={item.open_new_tab ? '_blank' : undefined}
        rel={item.open_new_tab ? 'noreferrer' : undefined}
        className={className}
        aria-haspopup={ariaHasPopup ? 'menu' : undefined}
        aria-expanded={ariaExpanded}
      >
        {label}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onGo(item)}
      onMouseEnter={() => onPrefetch(item)}
      onFocus={() => onPrefetch(item)}
      onTouchStart={() => onPrefetch(item)}
      className={className}
      aria-haspopup={ariaHasPopup ? 'menu' : undefined}
      aria-expanded={ariaExpanded}
    >
      {label}
    </button>
  )
}
