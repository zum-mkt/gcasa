import * as Dialog from '@radix-ui/react-dialog'
import { X, Globe, Phone, MapPin, ArrowRight } from 'lucide-react'
import type { Partner } from '@/types/models'

interface Props {
  partner: Partner | null
  onClose: () => void
}

const SvgInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)

const SvgFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const SvgWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export function ParceiroModal({ partner, onClose }: Props) {
  if (!partner) return null

  const links = [
    partner.site_url  && { icon: Globe,       label: 'Site',      href: partner.site_url, external: true },
    partner.phone     && { icon: Phone,        label: partner.phone, href: `tel:${partner.phone}`, external: false },
    partner.whatsapp  && { icon: SvgWhatsApp,  label: 'WhatsApp',  href: `https://wa.me/${partner.whatsapp.replace(/\D/g,'')}`, external: true },
    partner.instagram && { icon: SvgInstagram,  label: 'Instagram', href: partner.instagram.startsWith('http') ? partner.instagram : `https://instagram.com/${partner.instagram.replace('@','')}`, external: true },
    partner.facebook  && { icon: SvgFacebook,   label: 'Facebook',  href: partner.facebook.startsWith('http') ? partner.facebook : `https://facebook.com/${partner.facebook}`, external: true },
  ].filter(Boolean) as { icon: React.ElementType; label: string; href: string; external: boolean }[]

  const hasCover = !!(partner.cover_url || partner.logo_url)

  return (
    <Dialog.Root open={!!partner} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 animate-in fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                     w-full max-w-2xl mx-4 bg-white shadow-2xl
                     max-h-[90vh] flex flex-col overflow-hidden
                     animate-in fade-in-0 zoom-in-95"
        >
          {/* Hero */}
          <div className="relative h-48 sm:h-60 flex-shrink-0 bg-graphite-50">
            {partner.cover_url ? (
              <img src={partner.cover_url} alt={partner.name} className="w-full h-full object-cover" />
            ) : partner.logo_url ? (
              <div className="w-full h-full flex items-center justify-center p-10">
                <img src={partner.logo_url} alt={partner.name} className="max-h-28 w-auto object-contain" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-graphite-100 to-graphite-200 flex items-center justify-center">
                <span className="text-6xl heading-editorial text-graphite-300 select-none">{partner.name[0]}</span>
              </div>
            )}
            <div className={`absolute inset-0 ${partner.cover_url ? 'bg-gradient-to-t from-graphite-900/60 via-transparent to-transparent' : ''}`} />

            {/* Logo badge sobre cover (só quando tem cover) */}
            {partner.cover_url && partner.logo_url && (
              <div className="absolute bottom-4 left-5 bg-white p-2 shadow-lg">
                <img src={partner.logo_url} alt={partner.name} className="h-8 w-auto max-w-[100px] object-contain" />
              </div>
            )}

            {/* Nome + localização */}
            <div className={`absolute bottom-0 ${partner.cover_url && partner.logo_url ? 'left-24' : 'left-0'} right-0 p-5`}>
              {partner.cover_url && (
                <>
                  <Dialog.Title className="text-xl font-bold text-white heading-editorial leading-tight">
                    {partner.name}
                  </Dialog.Title>
                  {(partner.city || partner.state) && (
                    <p className="flex items-center gap-1 text-sm text-white/70 mt-0.5">
                      <MapPin size={12} />
                      {[partner.city, partner.state].filter(Boolean).join(' — ')}
                    </p>
                  )}
                </>
              )}
            </div>

            <Dialog.Close asChild>
              <button className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors" aria-label="Fechar">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">

            {/* Nome + categoria (quando não tem cover) */}
            {!partner.cover_url && (
              <div>
                <Dialog.Title className="text-xl font-bold text-graphite-900 heading-editorial">
                  {partner.name}
                </Dialog.Title>
                {(partner.category || partner.city) && (
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {partner.category && (
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary-500">
                        {partner.category}
                      </span>
                    )}
                    {partner.city && (
                      <span className="flex items-center gap-1 text-[0.7rem] text-graphite-400">
                        <MapPin size={11} /> {[partner.city, partner.state].filter(Boolean).join(' — ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Categoria (quando tem cover) */}
            {partner.cover_url && partner.category && (
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary-500 block">
                {partner.category}
              </span>
            )}

            {/* Descrição */}
            {partner.description && (
              <div>
                <h3 className="text-xs font-semibold text-graphite-400 uppercase tracking-widest mb-2">Sobre</h3>
                <p className="text-sm text-graphite-600 leading-relaxed">{partner.description}</p>
              </div>
            )}

            {/* Links de contato */}
            {links.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-graphite-400 uppercase tracking-widest mb-3">Contato</h3>
                <div className="flex flex-wrap gap-2">
                  {links.map(({ icon: Icon, label, href, external }) => (
                    <a
                      key={label}
                      href={href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-graphite-200 text-sm text-graphite-700 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                      <Icon size={14} />
                      {label}
                      <ArrowRight size={11} className="opacity-40" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
