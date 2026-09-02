import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { revealViewport, slideLeft, imageReveal, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'

const defaultItems = [
  { title: 'Compra conjunta', description: 'Melhor preço e condição com fornecedores, pela força do grupo.' },
  { title: 'Troca entre lojistas', description: 'Conversa direta com quem também tem loja de construção.' },
  { title: 'Treinamento da equipe', description: 'Cursos e encontros para quem atende e quem gerencia.' },
  { title: 'Informação de mercado', description: 'Números e tendências do setor, sem enrolação.' },
  { title: 'Novidades do setor', description: 'Acesso a produtos, marcas e jeitos novos de vender.' },
  { title: 'Gestão da loja', description: 'Ferramentas e apoio para organizar o resultado.' },
]

type BenefitItem = { icon?: string; title: string; description: string }
type BenefitsContent = { tag?: string; title?: string; image_url?: string; items: BenefitItem[] }

async function fetchBenefits(): Promise<BenefitsContent> {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'benefits').single()
  if (!data) return { items: defaultItems }
  return data.content as BenefitsContent
}

export function Benefits() {
  const { data } = useQuery({ queryKey: ['benefits-home'], queryFn: fetchBenefits })
  const items = data?.items ?? defaultItems
  const title = data?.title ?? 'O que sua loja ganha no grupo'
  const tag = data?.tag ?? 'VANTAGENS'
  const imageUrl = data?.image_url ?? null

  return (
    <section className="py-0 bg-white overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[560px]">

        {/* Left — photo */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={imageReveal}
          className="relative bg-graphite-50 min-h-[360px] lg:min-h-0"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Benefícios" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-graphite-50 via-graphite-100 to-graphite-50 flex items-center justify-center">
              <span className="text-7xl heading-editorial text-graphite-200 select-none">GCasa</span>
            </div>
          )}
          {/* Orange accent top-right */}
          <div className="absolute top-0 right-0 w-1 h-24 bg-primary-500" />
        </motion.div>

        {/* Right — cards sólidos */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-12 bg-offwhite">
          <motion.div initial="hidden" whileInView="show" viewport={revealViewport} variants={slideLeft}>
            <span className="section-label mb-4 block">{tag}</span>
            <h2 className="text-3xl lg:text-[2.75rem] heading-editorial text-graphite-900 text-balance mb-8">
              {title}
            </h2>
          </motion.div>

          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={staggerContainer(0.06)}
            className="grid sm:grid-cols-2 gap-3"
          >
            {items.map((b, i) => (
              <motion.li
                key={b.title}
                variants={staggerItem}
                className="bg-white border-2 border-graphite-200 p-5"
              >
                <span className="inline-flex w-9 h-9 items-center justify-center bg-primary-500 text-graphite-900 font-extrabold text-base mb-3">
                  {i + 1}
                </span>
                <p className="text-lg font-extrabold text-graphite-900 leading-snug">{b.title}</p>
                <p className="text-base text-graphite-700 mt-1.5 leading-snug">{b.description}</p>
              </motion.li>
            ))}
          </motion.ul>

          <Link to="/quero-me-associar" className="btn-obra mt-8 self-start">
            Quero me associar <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
