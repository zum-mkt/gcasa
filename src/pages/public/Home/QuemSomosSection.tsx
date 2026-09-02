import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BrandBlocks } from '@/components/layout/BrandBlocks'
import { revealViewport, slideLeft, imageReveal } from '@/hooks/useScrollAnimation'

const defaultHighlights = [
  'Compra conjunta com fornecedores',
  'Treinamento da equipe',
  'Troca entre donos de loja',
  'Informação de mercado',
  'Novos produtos e marcas',
  'Apoio na gestão da loja',
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
  const tag = about.tag ?? 'O GRUPO'
  const title = about.title ?? 'Unidos para comprar melhor'
  const highlight = about.title_highlight ?? 'e vender mais.'
  const description = about.description ?? 'O GCasa reúne lojas de materiais de construção do interior paulista. Juntos negociamos com fornecedores, treinamos equipes e trocamos o que funciona na prática.'
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
            <h2 className="text-3xl lg:text-5xl heading-editorial text-graphite-900 text-balance">
              {title}{' '}
              <em className="not-italic text-primary-500">{highlight}</em>
            </h2>
            <p className="mt-5 text-xl text-graphite-800 font-medium leading-snug max-w-lg">{description}</p>

            <ul className="mt-8 grid sm:grid-cols-2 gap-3">
              {highlights.map((b, i) => (
                <li key={i} className="flex items-center gap-3 bg-white border-2 border-graphite-200 px-4 py-3 text-base text-graphite-900 font-bold">
                  <span className="w-3 h-3 bg-primary-500 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            <Link to="/quem-somos" className="btn-obra mt-9">
              Conheça o grupo <ArrowRight size={20} />
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
