import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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
    <section className="py-24 bg-white overflow-hidden">
      <div className="container-site">
        <div className="grid lg:grid-cols-[1fr_500px] gap-16 xl:gap-24 items-center">

          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label mb-5 block">{tag}</span>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl heading-editorial text-graphite-900 text-balance">
              {title}{' '}
              <em className="not-italic text-primary-500">{highlight}</em>
            </h2>
            <p className="mt-6 text-graphite-500 leading-relaxed font-light max-w-lg">{description}</p>

            <ul className="mt-8 space-y-3">
              {highlights.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-graphite-600 font-light">
                  <span className="w-4 h-[1px] bg-primary-500 flex-shrink-0 mt-2.5" />
                  {b}
                </li>
              ))}
            </ul>

            <Link
              to="/quem-somos"
              className="inline-flex items-center gap-2 mt-10 text-sm font-semibold text-graphite-700 hover:text-primary-600 transition-colors border-b border-graphite-300 hover:border-primary-400 pb-0.5"
            >
              Saiba mais sobre o grupo <ArrowRight size={13} />
            </Link>
          </motion.div>

          {/* Right — image with offset accent */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
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
            <div className="absolute -bottom-6 -left-6 w-12 h-12 border-l-2 border-b-2 border-primary-500" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
