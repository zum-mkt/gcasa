import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type CtaContent = {
  title?: string; description?: string
  cta_primary_label?: string; cta_primary_href?: string
  cta_secondary_label?: string; cta_secondary_href?: string
}

async function fetchCta(): Promise<CtaContent> {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'cta').single()
  if (!data) return {}
  return data.content as CtaContent
}

export function CTASection() {
  const { data: cta = {} } = useQuery({ queryKey: ['cta-home'], queryFn: fetchCta })
  const title = cta.title ?? 'Sua empresa está pronta para crescer junto com a gente?'
  const description = cta.description ?? 'Faça parte da maior rede colaborativa do setor de materiais de construção do interior paulista.'
  const primaryLabel = cta.cta_primary_label ?? 'Quero me Associar'
  const primaryHref = cta.cta_primary_href ?? '/quero-me-associar'
  const secondaryLabel = cta.cta_secondary_label ?? 'Falar com um especialista'
  const secondaryHref = cta.cta_secondary_href ?? '/contato'

  return (
    <section className="bg-navy-950 py-0 overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[380px]">
        {/* Left — text block */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center px-10 py-16 lg:px-16 lg:py-20 relative"
        >
          {/* Orange top border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-500 lg:hidden" />
          <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-primary-500 hidden lg:block" />

          <span className="section-label-light mb-6">FAÇA PARTE</span>
          <h2 className="text-3xl lg:text-4xl heading-editorial text-white text-balance leading-tight">
            {title}
          </h2>
          <p className="mt-5 text-sm text-white/45 leading-relaxed max-w-sm font-light">
            {description}
          </p>
        </motion.div>

        {/* Right — actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col justify-center items-start px-10 py-16 lg:px-16 lg:py-20 bg-navy-900 gap-4"
        >
          <Link
            to={primaryHref}
            className="inline-flex items-center gap-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-4 transition-colors text-sm tracking-wide w-full max-w-xs justify-between"
          >
            {primaryLabel}
            <ArrowRight size={16} />
          </Link>
          <Link
            to={secondaryHref}
            className="inline-flex items-center gap-3 text-white/60 hover:text-white font-light px-8 py-4 border border-white/15 hover:border-white/30 transition-colors text-sm w-full max-w-xs justify-between"
          >
            {secondaryLabel}
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
