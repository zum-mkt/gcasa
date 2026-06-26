import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const SvgInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
)
const SvgLinkedin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
)
const SvgYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
)
const SvgFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
)

const navigation = {
  grupo: [
    { label: 'Quem Somos', href: '/quem-somos' },
    { label: 'Associados', href: '/associados' },
    { label: 'Eventos', href: '/eventos' },
    { label: 'Fornecedores', href: '/fornecedores' },
    { label: 'Conteúdo', href: '/blog' },
    { label: 'Contato', href: '/contato' },
  ],
  institucional: [
    { label: 'Missão, Visão e Valores', href: '/quem-somos#missao' },
    { label: 'Linha do Tempo', href: '/quem-somos#historia' },
    { label: 'Estatuto', href: '/estatuto' },
    { label: 'Código de Ética', href: '/codigo-etica' },
  ],
  associados: [
    { label: 'Benefícios', href: '/quem-somos#beneficios' },
    { label: 'Como se associar', href: '/quero-me-associar' },
    { label: 'Empresas associadas', href: '/associados' },
    { label: 'Eventos exclusivos', href: '/eventos' },
    { label: 'Capacitações', href: '/eventos?tipo=capacitacao' },
  ],
}

type SiteSettings = {
  company_name?: string; tagline?: string; phone?: string; email?: string
  address?: string; address_city?: string; address_state?: string; address_cep?: string
  logo_url?: string
}
type SocialSettings = { instagram?: string; facebook?: string; linkedin?: string; youtube?: string }

async function fetchFooterSettings() {
  const { data } = await supabase.from('settings').select('key, value').in('key', ['site', 'social'])
  const map: Record<string, Record<string, string>> = {}
  for (const row of data ?? []) map[row.key] = row.value as Record<string, string>
  return { site: (map.site ?? {}) as SiteSettings, social: (map.social ?? {}) as SocialSettings }
}

export function Footer() {
  const { data } = useQuery({ queryKey: ['footer-settings'], queryFn: fetchFooterSettings, staleTime: 5 * 60 * 1000 })
  const site = data?.site ?? {}
  const social = data?.social ?? {}

  const companyName = site.company_name ?? 'Grupo GCasa'
  const phone = site.phone ?? null
  const email = site.email ?? null
  const address = site.address ?? null
  const addressCity = site.address_city ?? null
  const addressState = site.address_state ?? null
  const addressCep = site.address_cep ?? null
  const logoUrl = site.logo_url ?? null

  const socialLinks = [
    { icon: SvgInstagram, href: social.instagram, label: 'Instagram' },
    { icon: SvgLinkedin, href: social.linkedin, label: 'LinkedIn' },
    { icon: SvgYoutube, href: social.youtube, label: 'YouTube' },
    { icon: SvgFacebook, href: social.facebook, label: 'Facebook' },
  ].filter(s => s.href)

  return (
    <footer className="bg-dark-900 text-white">
      <div className="container-site py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-16 w-auto object-contain" />
              ) : (
                <>
                  <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{companyName[0]}</span>
                  </div>
                  <p className="text-sm font-bold text-white leading-tight">{companyName}</p>
                </>
              )}
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              {site.tagline ?? 'Conectamos empresas, fortalecemos negócios e construímos juntos o futuro do setor.'}
            </p>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-6">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                    className="w-8 h-8 bg-white/10 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors">
                    <Icon />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Nav columns */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Navegação</p>
            <ul className="space-y-2">
              {navigation.grupo.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-white/50 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Institucional</p>
            <ul className="space-y-2">
              {navigation.institucional.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-white/50 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Associados</p>
            <ul className="space-y-2">
              {navigation.associados.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-white/50 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Fale Conosco</p>
            <ul className="space-y-3">
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/\D/g, '')}`} className="flex items-start gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <Phone size={13} className="mt-0.5 flex-shrink-0" />{phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-start gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <Mail size={13} className="mt-0.5 flex-shrink-0" />{email}
                  </a>
                </li>
              )}
              {address && (
                <li>
                  <address className="not-italic flex items-start gap-2 text-sm text-white/50">
                    <MapPin size={13} className="mt-0.5 flex-shrink-0" />
                    <span>
                      {address}<br />
                      {[addressCity, addressState].filter(Boolean).join(', ')}
                      {addressCep && <><br />CEP {addressCep}</>}
                    </span>
                  </address>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} {companyName}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/politica-de-privacidade" className="text-xs text-white/30 hover:text-white/60 transition-colors">Política de Privacidade</Link>
            <Link to="/termos-de-uso" className="text-xs text-white/30 hover:text-white/60 transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
