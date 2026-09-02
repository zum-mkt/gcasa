import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BrandBlocks } from '@/components/layout/BrandBlocks'
import { revealViewport, slideLeft, imageReveal } from '@/hooks/useScrollAnimation'

const defaultHighlights = [
  'Troca de experiências e boas práticas',
  'Capacitação e desenvolvimento',
  'Inteligência de mercado e tendências',
  'Inovação e transformação',
  'Negociação estratégica com fornecedores',
  'Gestão e performance',
]

type AboutContent = {
  tag?: string; title?: string; title_highlight?: string
  description?: string; image_url?: string | null; highlights?: string[]
}

async function fetchAbout(): Promise<AboutContent> {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'about').single()
  if (!data) return {}
  return data.content as AboutContent
}

export function QuemSomosSection() {
  const { data: about = {} } = useQuery({ queryKey: ['about-home'], queryFn: fetchAbout })
  const tag = about.tag ?? 'NOSSO PROPÓSITO'
  const title = about.title ?? 'Crescemos quando crescemos'
  const highlight = about.title_highlight ?? 'juntos.'
  const description = about.description ?? 'A união de empresários fortes cria um ecossistema que gera desenvolvimento, inovação e novas oportunidades para todos.'
  const image = about.image_url ?? null
  const highlights = about.highlights ?? defaultHighlights

  return (
    <section id="grupo" className="py-16 lg:py-20 bg-offwhite overflow-hidden scroll-mt-20">
      <div className="container-site">
        <div className="grid lg:grid-cols-[1fr_500px] gap-12 xl:gap-20 items-center">

          {/* Left — text */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={slideLeft}
          >
            <span className="section-label mb-4 block">{tag}</span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl heading-editorial text-graphite-900 text-balance">
              {title}{' '}
              <em className="not-italic text-primary-500">{highlight}</em>
            </h2>
            <p className="mt-5 text-lg text-graphite-700 leading-relaxed max-w-lg">{description}</p>

            <ul className="mt-7 space-y-3">
              {highlights.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-base text-graphite-800 font-medium">
                  <span className="w-5 h-[3px] bg-primary-500 flex-shrink-0 mt-2.5" />
                  {b}
                </li>
              ))}
            </ul>

            <Link
              to="/quem-somos"
              className="inline-flex items-center gap-2 mt-9 text-base font-bold text-graphite-800 hover:text-primary-600 transition-colors border-b-2 border-graphite-300 hover:border-primary-400 pb-0.5"
            >
              Saiba mais sobre o grupo <ArrowRight size={15} />
            </Link>
          </motion.div>

          {/* Right — image with offset accent */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={imageReveal}
            className="relative"
          >
            <div className="absolute -top-6 -right-6 bottom-6 left-6 bg-graphite-50 -z-10" />
            <div className="aspect-[4/5] bg-graphite-100 overflow-hidden">
              {image ? (
                <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-graphite-50 to-graphite-100 flex items-center justify-center">
                  <span className="text-7xl heading-editorial text-graphite-200 select-none">GCasa</span>
                </div>
              )}
            </div>
            <BrandBlocks className="absolute -bottom-6 -left-6" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
