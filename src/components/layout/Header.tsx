import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useScrolled } from '@/hooks/useScrollAnimation'
import { useMenuItems } from '@/hooks/useMenuItems'
import { prefetchRoute } from '@/lib/routePrefetch'
import type { MenuItem } from '@/types/menu'

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

/* Usado enquanto o menu_items ainda carrega, ou como rede de segurança caso a
   tabela esteja vazia (ex: migration 005 ainda não rodou) — mesmo padrão de
   fallback usado em Hero/Stats/Benefits para conteúdo vindo do Supabase. */
const FALLBACK_ITEMS: MenuItem[] = [
  { id: 'fallback-grupo',      label: 'Grupo',        order_index: 0, is_active: true, type: 'anchor', url: null, anchor: 'grupo',      path: null,                 open_new_tab: false, created_at: '', updated_at: '' },
  { id: 'fallback-associados', label: 'Associados',   order_index: 1, is_active: true, type: 'anchor', url: null, anchor: 'associados', path: null,                 open_new_tab: false, created_at: '', updated_at: '' },
  { id: 'fallback-eventos',    label: 'Eventos',      order_index: 2, is_active: true, type: 'anchor', url: null, anchor: 'eventos',    path: null,                 open_new_tab: false, created_at: '', updated_at: '' },
  { id: 'fallback-parceiros',  label: 'Fornecedores', order_index: 3, is_active: true, type: 'anchor', url: null, anchor: 'parceiros',  path: null,                 open_new_tab: false, created_at: '', updated_at: '' },
  { id: 'fallback-blog',       label: 'Blog',         order_index: 4, is_active: true, type: 'internal_page', url: null, anchor: null,  path: '/blog',              open_new_tab: false, created_at: '', updated_at: '' },
  { id: 'fallback-contato',    label: 'Contato',      order_index: 5, is_active: true, type: 'anchor', url: null, anchor: 'contato',    path: null,                 open_new_tab: false, created_at: '', updated_at: '' },
]

const HEADER_HEIGHT = 80

export function Header() {
  const isScrolled = useScrolled(20)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
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

  const scrollTo = (sectionId: string) => {
    setIsMobileOpen(false)

    const doScroll = () => {
      const el = document.getElementById(sectionId)
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT
      window.scrollTo({ top, behavior: 'smooth' })
    }

    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(doScroll, 500)
    } else {
      doScroll()
    }
  }

  const handleItemClick = (item: MenuItem) => {
    if (item.type === 'anchor' && item.anchor) {
      scrollTo(item.anchor)
    } else if (item.type === 'internal_page' && item.path) {
      setIsMobileOpen(false)
      navigate(item.path)
    }
    // external_url é renderizado como <a>, não passa por aqui
  }

  const prefetchItem = (item: MenuItem) => {
    if (item.type === 'internal_page' && item.path) prefetchRoute(item.path)
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

          {/* Logo — volta para o topo da home */}
          <button
            onClick={() => scrollTo('hero')}
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

          {/* Desktop nav — overflow-x-auto em vez de espremer/quebrar linha: com o menu
              agora editável pelo admin, o número de itens pode crescer sem limite. O
              degradê à direita avisa que dá pra rolar quando os itens não cabem todos. */}
          <div className="hidden xl:block relative min-w-0 flex-1">
          <nav className="flex items-center gap-0 min-w-0 overflow-x-auto scrollbar-hide">
            {menuItems.map((item) =>
              item.type === 'external_url' && item.url ? (
                <a
                  key={item.id}
                  href={item.url}
                  target={item.open_new_tab ? '_blank' : undefined}
                  rel={item.open_new_tab ? 'noreferrer' : undefined}
                  className="px-2.5 py-2 text-[0.82rem] font-medium transition-colors text-graphite-800 hover:text-primary-600 whitespace-nowrap flex-shrink-0"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => prefetchItem(item)}
                  onFocus={() => prefetchItem(item)}
                  className="px-2.5 py-2 text-[0.82rem] font-medium transition-colors text-graphite-800 hover:text-primary-600 whitespace-nowrap flex-shrink-0"
                >
                  {item.label}
                </button>
              )
            )}
          </nav>
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent" />
          </div>

          {/* CTA */}
          <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
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
            <button
              onClick={() => scrollTo('contato')}
              className="px-6 py-2.5 text-[0.9rem] font-bold text-graphite-900 bg-primary-500 hover:bg-primary-600 transition-colors tracking-wide whitespace-nowrap"
            >
              Associar-se
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="xl:hidden p-2 text-graphite-600 transition-colors"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="xl:hidden bg-white border-t border-graphite-100 px-6 py-6 space-y-1">
          {menuItems.map((item) =>
            item.type === 'external_url' && item.url ? (
              <a
                key={item.id}
                href={item.url}
                target={item.open_new_tab ? '_blank' : undefined}
                rel={item.open_new_tab ? 'noreferrer' : undefined}
                className="w-full text-left block py-2.5 text-base font-medium transition-colors text-graphite-800"
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                onTouchStart={() => prefetchItem(item)}
                className="w-full text-left block py-2.5 text-base font-medium transition-colors text-graphite-800"
              >
                {item.label}
              </button>
            )
          )}
          <div className="pt-4 border-t border-graphite-100 space-y-2 mt-4">
            <button
              onClick={() => scrollTo('contato')}
              className="w-full block py-3 text-base font-bold text-graphite-900 bg-primary-500 text-center"
            >
              Associar-se
            </button>
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
