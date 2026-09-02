import { Phone, MessageCircle } from 'lucide-react'
import type { AssociateBranch } from '@/types/models'
import { AssociadoGaleria } from './AssociadoGaleria'
import { AssociadoLocalizacao } from './AssociadoLocalizacao'

export function AssociadoFiliais({ branches }: { branches: AssociateBranch[] }) {
  const active = branches.filter((b) => b.active).sort((a, b) => a.order_index - b.order_index)
  if (active.length === 0) return null

  return (
    <div>
      <h2 className="section-label">Nossas Unidades</h2>
      <div className="h-px bg-primary-400/30 mt-3 mb-8" />

      <div className="space-y-12">
        {active.map((branch, i) => (
          <div key={branch.id} className={i > 0 ? 'pt-12 border-t border-primary-400/20' : ''}>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <h3 className="text-xl heading-editorial text-graphite-900">{branch.name}</h3>
              {branch.is_hq && (
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-1">
                  Matriz
                </span>
              )}
            </div>

            {(branch.phone || branch.whatsapp) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {branch.phone && (
                  <a href={`tel:${branch.phone.replace(/\D/g, '')}`} className="inline-flex items-center gap-2 px-4 py-2 border border-graphite-200 text-sm text-graphite-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
                    <Phone size={13} /> {branch.phone}
                  </a>
                )}
                {branch.whatsapp && (
                  <a href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 border border-graphite-200 text-sm text-graphite-700 hover:border-primary-400 hover:text-primary-600 transition-colors">
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
              </div>
            )}

            <div className="space-y-8">
              <AssociadoLocalizacao
                address={branch.address}
                city={branch.city}
                state={branch.state}
                businessHours={branch.business_hours}
                title="Endereço da unidade"
              />
              <AssociadoGaleria gallery={branch.gallery} title="Fotos da unidade" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
