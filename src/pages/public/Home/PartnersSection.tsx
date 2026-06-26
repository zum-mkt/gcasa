import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Partner } from '@/types/models'

async function fetchPartners(): Promise<Partner[]> {
  const { data } = await supabase
    .from('partners')
    .select('*')
    .eq('active', true)
    .order('order_index')
    .limit(18)
  return (data ?? []) as Partner[]
}

export function PartnersSection() {
  const { data: partners = [] } = useQuery({ queryKey: ['partners-home'], queryFn: fetchPartners })

  return (
    <section className="py-24 bg-white">
      <div className="container-site">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
          <div>
            <span className="section-label mb-4 block">PARCEIROS E FORNECEDORES</span>
            <h2 className="text-3xl lg:text-4xl heading-editorial text-graphite-900 text-balance">
              Marcas que acreditam<br />na força da nossa rede.
            </h2>
          </div>
          <Link
            to="/sou-fornecedor"
            className="inline-flex items-center gap-2 text-sm font-semibold text-graphite-700 hover:text-primary-600 border-b border-graphite-300 hover:border-primary-400 pb-0.5 transition-colors self-start lg:self-auto whitespace-nowrap"
          >
            Seja um parceiro <ArrowRight size={13} />
          </Link>
        </div>

        {partners.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-24 border border-graphite-50 flex items-center justify-center">
                <div className="w-20 h-6 bg-graphite-100 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-3 border-l border-t border-graphite-100"
          >
            {partners.map((p) => {
              const img = (
                <img
                  src={p.logo_url}
                  alt={p.name ?? ''}
                  style={{ height: 140, width: 'auto', maxWidth: '88%' }}
                  className="hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              )
              return p.site_url ? (
                <a
                  key={p.id}
                  href={p.site_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center h-44 border-r border-b border-graphite-100 hover:bg-offwhite transition-colors"
                >
                  {img}
                </a>
              ) : (
                <div
                  key={p.id}
                  className="flex items-center justify-center h-44 border-r border-b border-graphite-100"
                >
                  {img}
                </div>
              )
            })}
          </motion.div>
        )}
      </div>
    </section>
  )
}
