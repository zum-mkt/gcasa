import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

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

const navLinks = [
  { label: 'Grupo', href: '/quem-somos' },
  { label: 'Associados', href: '/associados' },
  { label: 'Eventos', href: '/eventos' },
  { label: 'Fornecedores', href: '/fornecedores' },
  {
    label: 'Conteúdo',
    children: [
      { label: 'Blog', href: '/blog' },
      { label: 'Galeria', href: '/galeria' },
    ],
  },
  { label: 'Contato', href: '/contato' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const { data: siteSettings } = useQuery({ queryKey: ['header-site-settings'], queryFn: fetchSiteSettings, staleTime: 5 * 60 * 1000 })
  const logoUrl = siteSettings?.site?.logo_url ?? null
  const companyName = siteSettings?.site?.company_name ?? 'Grupo GCasa'
  const instagramUrl = siteSettings?.social?.instagram ?? null
  const facebookUrl = siteSettings?.social?.facebook ?? null

  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

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

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} style={{ height: 60, width: 'auto' }} />
            ) : (
              <>
                <div className="w-8 h-8 bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{companyName[0]}</span>
                </div>
                <span className="hidden sm:block text-sm font-semibold text-graphite-900 tracking-wide">{companyName}</span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0">
            {navLinks.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center gap-1 px-4 py-2 text-[0.8rem] font-medium text-graphite-500 hover:text-graphite-900 transition-colors tracking-wide">
                    {item.label}
                    <ChevronDown size={12} className={cn('transition-transform', openDropdown === item.label && 'rotate-180')} />
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-1 min-w-[160px]">
                      <div className="bg-white border border-graphite-100 shadow-dropdown p-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            className={({ isActive }) =>
                              cn(
                                'block px-4 py-2 text-[0.8rem] transition-colors',
                                isActive ? 'text-primary-600 bg-primary-50' : 'text-graphite-600 hover:text-graphite-900 hover:bg-graphite-50'
                              )
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href!}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 text-[0.8rem] font-medium transition-colors tracking-wide',
                      isActive ? 'text-primary-600' : 'text-graphite-500 hover:text-graphite-900'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {(instagramUrl || facebookUrl) && (
              <div className="flex items-center gap-1.5 border-r border-graphite-100 pr-3 mr-0.5">
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"
                    className="p-1.5 text-graphite-400 hover:text-primary-600 transition-colors">
                    <SvgInstagram />
                  </a>
                )}
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"
                    className="p-1.5 text-graphite-400 hover:text-primary-600 transition-colors">
                    <SvgFacebook />
                  </a>
                )}
              </div>
            )}
            <Link
              to="/sou-fornecedor"
              className="text-[0.8rem] font-medium text-graphite-500 hover:text-graphite-900 transition-colors tracking-wide"
            >
              Sou Fornecedor
            </Link>
            <Link
              to="/quero-me-associar"
              className="px-5 py-2 text-[0.8rem] font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors tracking-wide"
            >
              Associar-se
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 text-graphite-600 transition-colors"
          >
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileOpen && (
        <div className="lg:hidden bg-white border-t border-graphite-100 px-6 py-6 space-y-1">
          {navLinks.map((item) =>
            item.children ? (
              <div key={item.label}>
                <p className="py-1 text-[0.65rem] font-bold text-graphite-400 uppercase tracking-widest mt-2">{item.label}</p>
                {item.children.map((child) => (
                  <NavLink
                    key={child.href}
                    to={child.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      cn('block py-2.5 text-sm pl-3 transition-colors', isActive ? 'text-primary-600' : 'text-graphite-600')
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink
                key={item.href}
                to={item.href!}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  cn('block py-2.5 text-sm font-medium transition-colors', isActive ? 'text-primary-600' : 'text-graphite-600')
                }
              >
                {item.label}
              </NavLink>
            )
          )}
          <div className="pt-4 border-t border-graphite-100 space-y-2 mt-4">
            <Link to="/sou-fornecedor" onClick={() => setIsMobileOpen(false)} className="block py-2.5 text-sm text-graphite-600 border border-graphite-200 text-center">
              Sou Fornecedor
            </Link>
            <Link to="/quero-me-associar" onClick={() => setIsMobileOpen(false)} className="block py-2.5 text-sm font-semibold text-white bg-primary-500 text-center">
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
