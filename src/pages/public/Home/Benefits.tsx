import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const defaultItems = [
  { title: 'Inteligência de Mercado', description: 'Acesso a dados, indicadores e análises exclusivas do setor de materiais de construção.' },
  { title: 'Networking Estratégico', description: 'Conexão direta com empresários, líderes e tomadores de decisão do mercado.' },
  { title: 'Poder de Negociação', description: 'Melhores condições comerciais com fornecedores pela força do grupo.' },
  { title: 'Capacitação Contínua', description: 'Treinamentos, workshops e programas de desenvolvimento para sua equipe.' },
  { title: 'Inovação Aplicada', description: 'Acesso antecipado a novas soluções, tecnologias e metodologias do setor.' },
  { title: 'Gestão e Performance', description: 'Ferramentas e suporte especializado para evoluir seus resultados.' },
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
  const title = data?.title ?? 'Por que fazer parte do Grupo GCasa?'
  const tag = data?.tag ?? 'BENEFÍCIOS'
  const imageUrl = data?.image_url ?? null

  return (
    <section className="py-0 bg-white overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[560px]">

        {/* Left — photo */}
        <div className="relative bg-graphite-50 min-h-[360px] lg:min-h-0">
          {imageUrl ? (
            <img src={imageUrl} alt="Benefícios" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-graphite-50 via-graphite-100 to-graphite-50 flex items-center justify-center">
              <span className="text-7xl heading-editorial text-graphite-200 select-none">GCasa</span>
            </div>
          )}
          {/* Orange accent top-right */}
          <div className="absolute top-0 right-0 w-1 h-24 bg-primary-500" />
        </div>

        {/* Right — editorial list */}
        <div className="flex flex-col justify-center px-10 py-16 lg:px-16 bg-offwhite">
          <span className="section-label mb-5">{tag}</span>
          <h2 className="text-3xl lg:text-4xl heading-editorial text-graphite-900 text-balance mb-10">
            {title}
          </h2>

          <ul className="space-y-0">
            {items.map((b, i) => (
              <motion.li
                key={b.title}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex gap-5 py-5 border-b border-graphite-100 last:border-0"
              >
                <span className="text-[0.65rem] text-primary-500 font-bold tracking-widest mt-1 w-5 flex-shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-semibold text-graphite-900 mb-0.5">{b.title}</p>
                  <p className="text-sm text-graphite-500 leading-relaxed font-light">{b.description}</p>
                </div>
              </motion.li>
            ))}
          </ul>

          <Link
            to="/quero-me-associar"
            className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors self-start"
          >
            Quero me associar <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  )
}
