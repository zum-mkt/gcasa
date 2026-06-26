import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, MapPin, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Associate } from '@/types/models'

async function fetchAssociates(): Promise<Associate[]> {
  const { data } = await supabase
    .from('associates')
    .select('id, name, slug, logo_url, city, state, store_image_url, description')
    .eq('active', true)
    .order('order_index')
    .limit(8)
  return (data ?? []) as Associate[]
}

export function AssociatesSection() {
  const { data: associates = [] } = useQuery({ queryKey: ['associates-home'], queryFn: fetchAssociates })
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' })
  }

  return (
    <section className="py-24 bg-offwhite">
      <div className="container-site">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <span className="section-label mb-4 block">ASSOCIADOS</span>
            <h2 className="text-3xl lg:text-4xl heading-editorial text-graphite-900 text-balance">
              Uma rede presente em{' '}
              <em className="not-italic text-primary-500">diversas regiões.</em>
            </h2>
            <p className="mt-3 text-graphite-500 text-sm font-light max-w-md">
              Empresas que acreditam na força da colaboração e no crescimento sustentável do setor.
            </p>
            <Link
              to="/associados"
              className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-graphite-700 hover:text-primary-600 transition-colors border-b border-graphite-300 hover:border-primary-400 pb-0.5"
            >
              Ver todos os associados <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => scroll('left')} className="w-9 h-9 border border-graphite-200 flex items-center justify-center hover:bg-white hover:border-graphite-300 transition-colors" aria-label="Anterior">
              <ChevronLeft size={15} />
            </button>
            <button onClick={() => scroll('right')} className="w-9 h-9 bg-graphite-900 text-white flex items-center justify-center hover:bg-graphite-700 transition-colors" aria-label="Próximo">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {associates.length === 0 ? null : (
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-8 px-8">
            {associates.map((assoc) => (
              <Link
                key={assoc.id}
                to={`/associados/${assoc.slug}`}
                className="group flex-none w-[300px] bg-white overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-44 bg-graphite-100 relative overflow-hidden">
                  {assoc.store_image_url ? (
                    <img src={assoc.store_image_url} alt={assoc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-graphite-50 flex items-center justify-center">
                      {assoc.logo_url
                        ? <img src={assoc.logo_url} alt={assoc.name} className="w-24 object-contain opacity-40" loading="lazy" />
                        : <span className="text-3xl heading-editorial text-graphite-300">{assoc.name[0]}</span>
                      }
                    </div>
                  )}
                  {assoc.logo_url && (
                    <div className="absolute bottom-3 left-3 bg-white p-1.5 shadow-sm">
                      <img src={assoc.logo_url} alt={assoc.name} className="h-5 object-contain max-w-[70px]" />
                    </div>
                  )}
                </div>
                <div className="p-5 border-b-2 border-transparent group-hover:border-primary-500 transition-all">
                  <h3 className="text-sm font-semibold text-graphite-900">{assoc.name}</h3>
                  {assoc.city && (
                    <p className="flex items-center gap-1 text-[0.7rem] text-graphite-400 mt-1 font-light">
                      <MapPin size={10} />
                      {assoc.city}{assoc.state ? ` — ${assoc.state}` : ''}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 mt-3 text-[0.7rem] font-semibold text-graphite-400 group-hover:text-primary-600 transition-colors tracking-wide uppercase">
                    Saiba mais <ArrowRight size={10} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
