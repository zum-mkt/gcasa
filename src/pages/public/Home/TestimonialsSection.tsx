import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import type { Testimonial } from '@/types/models'

async function fetchTestimonials(): Promise<Testimonial[]> {
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .eq('active', true)
    .order('order_index')
  return (data ?? []) as Testimonial[]
}

const defaultTestimonials: Testimonial[] = [
  {
    id: 'd1', avatar_url: null, active: true, order_index: 0,
    author_name: 'Carlos Henrique', author_role: 'Diretor', company: 'Materiais Paraíso',
    text: 'Fazer parte do Grupo GCasa transformou a forma como conduzimos os negócios. O networking e o poder de compra coletivo nos trouxeram resultados que nunca conseguiríamos sozinhos.',
  },
  {
    id: 'd2', avatar_url: null, active: true, order_index: 1,
    author_name: 'Ana Paula Ferreira', author_role: 'Gerente Comercial', company: 'Construmax',
    text: 'Os treinamentos e eventos do grupo elevaram o nível da nossa equipe. Hoje somos muito mais competitivos no mercado regional graças à troca de conhecimento com os outros associados.',
  },
  {
    id: 'd3', avatar_url: null, active: true, order_index: 2,
    author_name: 'Roberto Martins', author_role: 'Proprietário', company: 'Casa & Obra',
    text: 'A inteligência de mercado compartilhada pelo grupo nos ajudou a tomar decisões mais assertivas. O retorno sobre o investimento na associação foi visível logo no primeiro ano.',
  },
]

export function TestimonialsSection() {
  const { data: fetched = [] } = useQuery({ queryKey: ['testimonials-home'], queryFn: fetchTestimonials })
  const testimonials = fetched.length > 0 ? fetched : defaultTestimonials
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))

  const t = testimonials[current]

  return (
    <section className="bg-navy-900 text-white py-24 overflow-hidden">
      <div className="container-site">
        <div className="grid lg:grid-cols-[320px_1fr] gap-16 items-center">

          {/* Left */}
          <div>
            <span className="section-label-light mb-5 block">DEPOIMENTOS</span>
            <h2 className="text-3xl lg:text-4xl heading-editorial text-white text-balance">
              O que os associados dizem sobre o grupo
            </h2>
            {/* Orange divider */}
            <div className="w-12 h-[2px] bg-primary-500 mt-8 mb-8" />
            <div className="flex items-center gap-4">
              <button
                onClick={prev}
                className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-white/30 tabular-nums">
                {String(current + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
              </span>
              <button
                onClick={next}
                className="w-10 h-10 bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right — quote */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="relative"
            >
              {/* Large decorative quote mark */}
              <span className="absolute -top-8 -left-2 text-[7rem] leading-none text-primary-500/20 font-serif select-none pointer-events-none">"</span>

              <p className="text-xl lg:text-2xl heading-editorial text-white/85 leading-relaxed font-light relative z-10">
                {t.text}
              </p>

              <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-navy-700 flex items-center justify-center flex-shrink-0">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.author_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-light text-sm">{getInitials(t.author_name)}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.author_name}</p>
                  {(t.author_role || t.company) && (
                    <p className="text-xs text-white/35 mt-0.5 font-light">
                      {[t.author_role, t.company].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
