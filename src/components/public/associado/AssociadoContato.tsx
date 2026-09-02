import { Phone, MessageCircle, Globe, Mail } from 'lucide-react'
import type { Associate } from '@/types/models'

const SvgInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)
const SvgFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

function waHref(whatsapp: string) {
  return `https://wa.me/${whatsapp.replace(/\D/g, '')}`
}

export function AssociadoContato({ associate }: { associate: Associate }) {
  const cards = [
    associate.phone && { icon: Phone, label: 'Telefone', value: associate.phone, href: `tel:${associate.phone.replace(/\D/g, '')}` },
    associate.whatsapp && { icon: MessageCircle, label: 'WhatsApp', value: associate.whatsapp, href: waHref(associate.whatsapp) },
    associate.site_url && { icon: Globe, label: 'Site', value: associate.site_url.replace(/^https?:\/\//, ''), href: associate.site_url },
    associate.email && { icon: Mail, label: 'Email', value: associate.email, href: `mailto:${associate.email}` },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; href: string }[]

  const socials = [
    associate.instagram && { icon: SvgInstagram, label: 'Instagram', href: associate.instagram.startsWith('http') ? associate.instagram : `https://instagram.com/${associate.instagram.replace('@', '')}` },
    associate.facebook && { icon: SvgFacebook, label: 'Facebook', href: associate.facebook.startsWith('http') ? associate.facebook : `https://facebook.com/${associate.facebook}` },
  ].filter(Boolean) as { icon: React.ElementType; label: string; href: string }[]

  if (cards.length === 0 && socials.length === 0) return null

  return (
    <div>
      {cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
              className="flex flex-col gap-2 p-4 border border-graphite-100 hover:border-primary-400 transition-colors group"
            >
              <div className="w-9 h-9 bg-graphite-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors">
                <Icon size={16} className="text-graphite-500 group-hover:text-primary-600 transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-graphite-400">{label}</p>
                <p className="text-sm font-semibold text-graphite-900 truncate">{value}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {socials.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          {socials.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="w-9 h-9 flex items-center justify-center border border-graphite-200 text-graphite-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <Icon />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
