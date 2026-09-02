import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BrandBlocks } from '@/components/layout/BrandBlocks'
import { revealViewport, slideLeft } from '@/hooks/useScrollAnimation'

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
  const title = cta.title ?? 'Quer associar sua loja ao GCasa?'
  const description = cta.description ?? 'Explicamos como funciona, o que você precisa e o próximo passo.'
  const primaryLabel = cta.cta_primary_label ?? 'Quero me Associar'
  const primaryHref = cta.cta_primary_href ?? '/quero-me-associar'
  const secondaryLabel = cta.cta_secondary_label ?? 'Falar com um especialista'
  const secondaryHref = cta.cta_secondary_href ?? '/contato'

  return (
    <section id="contato" className="texture-concrete texture-concrete--dark bg-graphite-900 py-0 overflow-hidden scroll-mt-20 relative">
      <BrandBlocks className="absolute bottom-6 left-6 lg:left-10 hidden sm:block" />
      <div className="grid lg:grid-cols-2 min-h-[380px]">
        {/* Left — text block */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={slideLeft}
          className="flex flex-col justify-center px-10 py-14 lg:px-16 lg:py-16 relative"
        >
          {/* Orange top border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500 lg:hidden" />
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary-500 hidden lg:block" />

          <span className="section-label-light mb-5">FAÇA PARTE</span>
          <h2 className="text-3xl lg:text-5xl heading-editorial text-white text-balance leading-tight">
            {title}
          </h2>
          <p className="mt-5 text-xl text-white font-medium leading-snug max-w-md">
            {description}
          </p>
        </motion.div>

        {/* Right — actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col justify-center items-start px-10 py-14 lg:px-16 lg:py-16 gap-4"
        >
          <Link to={primaryHref} className="btn-obra w-full max-w-sm justify-between shadow-card">
            {primaryLabel}
            <ArrowRight size={22} />
          </Link>
          <Link
            to={secondaryHref}
            className="inline-flex items-center gap-3 text-white hover:text-primary-400 font-extrabold px-7 py-4 border-2 border-white hover:border-primary-400 transition-colors text-lg w-full max-w-sm justify-between min-h-14"
          >
            {secondaryLabel}
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
