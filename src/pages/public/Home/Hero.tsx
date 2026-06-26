import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUiStore } from '@/stores/uiStore'
import type { HeroContent } from '@/types/models'

async function fetchHero(): Promise<HeroContent> {
  const { data } = await supabase
    .from('home_content')
    .select('content')
    .eq('section', 'hero')
    .single()
  if (!data) return defaultHero
  return data.content as HeroContent
}

const defaultHero: HeroContent = {
  tag: 'REDE EMPRESARIAL DO SETOR DE CONSTRUÇÃO',
  title: 'Construindo empresas mais fortes através da',
  title_highlight: 'colaboração.',
  description: 'O Grupo GCasa reúne empresários do setor de materiais de construção para gerar desenvolvimento, compartilhar conhecimento e fortalecer resultados.',
  cta_primary_label: 'Quero me Associar',
  cta_primary_href: '/quero-me-associar',
  cta_secondary_label: 'Conheça o Grupo',
  cta_secondary_href: '/quem-somos',
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] } }),
}

export function Hero() {
  const { data: hero = defaultHero } = useQuery({
    queryKey: ['home-hero'],
    queryFn: fetchHero,
  })
  const { bannerH } = useUiStore()

  return (
    <section className="relative min-h-screen flex flex-col bg-navy-900 overflow-hidden">
      {hero.image_url && (
        <img
          src={hero.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/75 to-navy-900/30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-500 opacity-80" />

      <div className="relative z-10 container-site flex-1 flex items-center pb-16" style={{ paddingTop: bannerH + 112 }}>
        <div className="grid lg:grid-cols-[1fr_440px] gap-20 items-center w-full">
          <div>
            {hero.tag && (
              <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="section-label-light mb-6">
                {hero.tag}
              </motion.p>
            )}

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="text-4xl md:text-5xl lg:text-6xl xl:text-[4.5rem] heading-editorial text-white leading-[1.05] text-balance"
            >
              {hero.title}
              {hero.title_highlight && (
                <> <span className="text-primary-500">{hero.title_highlight}</span></>
              )}
            </motion.h1>

            {hero.description && (
              <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show" className="mt-7 text-base text-white/55 leading-relaxed max-w-xl font-light">
                {hero.description}
              </motion.p>
            )}

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="mt-10 flex flex-wrap gap-4">
              <Link
                to={hero.cta_primary_href ?? '/quero-me-associar'}
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3.5 transition-colors text-sm tracking-wide"
              >
                {hero.cta_primary_label}
                <ArrowRight size={14} />
              </Link>
              <Link
                to={hero.cta_secondary_href ?? '/quem-somos'}
                className="inline-flex items-center gap-2 text-white/70 hover:text-white font-light px-8 py-3.5 border border-white/20 hover:border-white/40 transition-colors text-sm"
              >
                {hero.cta_secondary_label}
              </Link>
            </motion.div>
          </div>

          {hero.image_url && (
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="hidden lg:block relative">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={hero.image_url} alt="Grupo GCasa" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 to-transparent" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-14 h-14 border-l-2 border-b-2 border-primary-500 opacity-50" />
            </motion.div>
          )}
        </div>
      </div>

    </section>
  )
}
