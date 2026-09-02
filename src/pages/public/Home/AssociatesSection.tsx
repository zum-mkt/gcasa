import { useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, MapPin, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { shuffle } from '@/lib/utils'
import type { Associate } from '@/types/models'
import { revealViewport, slideLeft, staggerContainer, staggerItem, hoverLiftGold } from '@/hooks/useScrollAnimation'
import { StoresMap } from '@/components/public/StoresMap'

async function fetchAssociates(): Promise<Associate[]> {
  const { data } = await supabase
    .from('associates')
    .select('id, name, slug, logo_url, city, state, store_image_url, description, site_url, instagram, facebook, whatsapp, gallery, category:categories(name, slug)')
    .eq('active', true)
    .order('order_index')
    .limit(20)
  return (data ?? []) as Associate[]
}

const MotionLink = motion.create(Link)

export function AssociatesSection() {
  const { data } = useQuery({ queryKey: ['associates-home'], queryFn: fetchAssociates })
  // Embaralhado no render (não na query) para não "congelar" uma ordem sorteada
  // dentro do cache persistido em localStorage — cada visita nova ao site vê uma
  // ordem diferente, mas a ordem fica estável enquanto o usuário navega pelo site.
  const associates = useMemo(() => shuffle(data ?? []), [data])
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 360 : -360, behavior: 'smooth' })
  }

  return (
    <section id="associados" className="pt-16 lg:pt-20 bg-offwhite scroll-mt-20">
      <div className="container-site">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={slideLeft}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10"
        >
          <div>
            <span className="section-label mb-4 block">ASSOCIADOS</span>
            <h2 className="text-3xl lg:text-[2.75rem] heading-editorial text-graphite-900 text-balance">
              Uma rede presente em{' '}
              <em className="not-italic text-primary-500">diversas regiões.</em>
            </h2>
            <p className="mt-3 text-graphite-700 text-lg font-medium max-w-md">
              18 lojas no interior de São Paulo. Clique na loja ou no mapa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => scroll('left')} className="w-12 h-12 border-2 border-graphite-300 text-graphite-800 flex items-center justify-center hover:border-graphite-900 hover:bg-white transition-colors" aria-label="Anterior">
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => scroll('right')} className="w-12 h-12 border-2 border-graphite-300 text-graphite-800 flex items-center justify-center hover:border-graphite-900 hover:bg-white transition-colors" aria-label="Próximo">
              <ChevronRight size={22} />
            </button>
          </div>
        </motion.div>

        {associates.length > 0 && (
          <motion.div
            ref={scrollRef}
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={staggerContainer(0.08)}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-8 px-8 mb-12"
          >
            {associates.map((assoc) => (
              <MotionLink
                key={assoc.id}
                to={`/associados/${assoc.slug}`}
                variants={staggerItem}
                className={`group flex-none w-[320px] flex flex-col bg-white border-2 border-graphite-200 overflow-hidden text-left ${hoverLiftGold}`}
              >
                <div className="h-56 bg-graphite-100 relative overflow-hidden">
                  {assoc.store_image_url ? (
                    <img src={assoc.store_image_url} alt={assoc.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-graphite-50 flex items-center justify-center">
                      {assoc.logo_url
                        ? <img src={assoc.logo_url} alt={assoc.name} className="w-24 object-contain opacity-40" loading="lazy" />
                        : <span className="text-3xl heading-editorial text-graphite-300">{assoc.name[0]}</span>
                      }
                    </div>
                  )}
                  {assoc.logo_url && (
                    <div className="absolute bottom-3 left-3 bg-white p-2 shadow-sm">
                      <img src={assoc.logo_url} alt={assoc.name} className="h-9 object-contain max-w-[110px]" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-extrabold text-graphite-900 leading-snug">{assoc.name}</h3>
                  {assoc.city && (
                    <p className="flex items-center gap-1.5 text-base text-graphite-700 mt-1.5 font-bold">
                      <MapPin size={16} />
                      {assoc.city}{assoc.state ? ` — ${assoc.state}` : ''}
                    </p>
                  )}
                  {assoc.description && (
                    <p className="text-base text-graphite-700 mt-2 line-clamp-2 leading-snug">
                      {assoc.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-2 mt-auto pt-4 text-base font-extrabold text-graphite-900 group-hover:text-primary-600 transition-colors">
                    Ver loja <ArrowRight size={18} />
                  </span>
                </div>
              </MotionLink>
            ))}
          </motion.div>
        )}
      </div>

      <StoresMap
        associates={associates.map((a) => ({ name: a.name, slug: a.slug }))}
        className="mt-4"
      />
    </section>
  )
}
