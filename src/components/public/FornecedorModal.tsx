import * as Dialog from '@radix-ui/react-dialog'
import { X, Globe, Phone, Mail, ArrowRight } from 'lucide-react'
import type { Supplier } from '@/types/models'

interface Props {
  supplier: Supplier | null
  onClose: () => void
}

export function FornecedorModal({ supplier, onClose }: Props) {
  if (!supplier) return null

  const links = [
    supplier.site_url      && { icon: Globe, label: 'Site',     href: supplier.site_url,                    external: true  },
    supplier.contact_phone && { icon: Phone, label: supplier.contact_phone, href: `tel:${supplier.contact_phone}`, external: false },
    supplier.contact_email && { icon: Mail,  label: supplier.contact_email, href: `mailto:${supplier.contact_email}`, external: false },
  ].filter(Boolean) as { icon: React.ElementType; label: string; href: string; external: boolean }[]

  return (
    <Dialog.Root open={!!supplier} onOpenChange={(v) => !v && onClose()}>
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
            {supplier.image_url ? (
              <img src={supplier.image_url} alt={supplier.name} className="w-full h-full object-cover" />
            ) : supplier.logo_url ? (
              <div className="w-full h-full flex items-center justify-center p-10">
                <img src={supplier.logo_url} alt={supplier.name} className="max-h-28 w-auto object-contain" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-graphite-100 to-graphite-200 flex items-center justify-center">
                <span className="text-6xl heading-editorial text-graphite-300 select-none">{supplier.name[0]}</span>
              </div>
            )}

            {supplier.image_url && (
              <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/60 via-transparent to-transparent" />
            )}

            {/* Logo badge sobre imagem */}
            {supplier.image_url && supplier.logo_url && (
              <div className="absolute bottom-4 left-5 bg-white p-2 shadow-lg">
                <img src={supplier.logo_url} alt={supplier.name} className="h-8 w-auto max-w-[100px] object-contain" />
              </div>
            )}

            {/* Nome sobre imagem */}
            {supplier.image_url && (
              <div className={`absolute bottom-0 ${supplier.logo_url ? 'left-24' : 'left-0'} right-0 p-5`}>
                <Dialog.Title className="text-xl font-bold text-white heading-editorial leading-tight">
                  {supplier.name}
                </Dialog.Title>
              </div>
            )}

            <Dialog.Close asChild>
              <button
                className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">

            {/* Nome + categoria (quando não tem image_url) */}
            {!supplier.image_url && (
              <div>
                <Dialog.Title className="text-xl font-bold text-graphite-900 heading-editorial">
                  {supplier.name}
                </Dialog.Title>
                {supplier.category && (
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary-500 mt-1 block">
                    {supplier.category.name}
                  </span>
                )}
              </div>
            )}

            {/* Categoria (quando tem image_url) */}
            {supplier.image_url && supplier.category && (
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary-500 block">
                {supplier.category.name}
              </span>
            )}

            {/* Descrição */}
            {supplier.description && (
              <div>
                <h3 className="text-xs font-semibold text-graphite-400 uppercase tracking-widest mb-2">Sobre</h3>
                <p className="text-sm text-graphite-600 leading-relaxed">{supplier.description}</p>
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

            {/* Galeria */}
            {supplier.gallery && supplier.gallery.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-graphite-400 uppercase tracking-widest mb-3">Galeria</h3>
                <div className="grid grid-cols-3 gap-1">
                  {supplier.gallery.map((url, i) => (
                    <div key={i} className="aspect-square bg-graphite-100 overflow-hidden">
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </div>
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
