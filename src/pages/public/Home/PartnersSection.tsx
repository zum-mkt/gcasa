import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Partner } from '@/types/models'
import { ParceiroModal } from '@/components/public/ParceiroModal'
import { revealViewport, slideLeft, staggerContainer, staggerItem, hoverLiftGold } from '@/hooks/useScrollAnimation'

const PAGE_SIZE = 16

async function fetchPartners(): Promise<Partner[]> {
  const { data } = await supabase
    .from('partners')
    .select('*')
    .eq('active', true)
    .order('order_index')
  return (data ?? []) as Partner[]
}

export function PartnersSection() {
  const { data: partners = [], isLoading } = useQuery({ queryKey: ['partners-home'], queryFn: fetchPartners })
  const [selected, setSelected] = useState<Partner | null>(null)
  const [page, setPage] = useState(0)

  if (!isLoading && partners.length === 0) return null

  const pageCount = Math.ceil(partners.length / PAGE_SIZE)
  const paged = partners.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <section id="parceiros" className="py-16 lg:py-20 bg-offwhite scroll-mt-20">
      <div className="container-site">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={slideLeft}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10"
        >
          <div>
            <span className="section-label mb-4 block">PARCEIROS E FORNECEDORES</span>
            <h2 className="text-3xl lg:text-4xl heading-editorial text-graphite-900 text-balance">
              Marcas que acreditam<br />na força da nossa rede.
            </h2>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('contato')
              if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 text-base font-bold text-graphite-800 hover:text-primary-600 border-b-2 border-graphite-300 hover:border-primary-400 pb-0.5 transition-colors self-start lg:self-auto whitespace-nowrap"
          >
            Seja um parceiro <ArrowRight size={15} />
          </button>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-white border border-graphite-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            key={page}
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={staggerContainer(0.06)}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {paged.map((p) => (
              <motion.button
                key={p.id}
                variants={staggerItem}
                onClick={() => setSelected(p)}
                className={`group text-center bg-white border border-graphite-100 shadow-sm overflow-hidden flex flex-col items-center justify-center gap-4 h-40 px-8 ${hoverLiftGold}`}
                title={p.name}
              >
                <div className="h-12 w-full flex items-center justify-center">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="max-h-12 w-auto max-w-[70%] object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : p.cover_url ? (
                    <img src={p.cover_url} alt={p.name} className="max-h-12 w-auto max-w-[70%] object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <span className="text-2xl heading-editorial text-graphite-300 select-none">{p.name[0]}</span>
                  )}
                </div>
                <span className="text-xs font-bold text-graphite-600 group-hover:text-primary-600 transition-colors tracking-wide">{p.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {!isLoading && pageCount > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 flex items-center justify-center border border-graphite-200 text-graphite-600 disabled:opacity-30 hover:bg-graphite-50 transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-graphite-500 tracking-wide">
              Página {page + 1} de {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              className="w-9 h-9 flex items-center justify-center border border-graphite-200 text-graphite-600 disabled:opacity-30 hover:bg-graphite-50 transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <ParceiroModal partner={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
