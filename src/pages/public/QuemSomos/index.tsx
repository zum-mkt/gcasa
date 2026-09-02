import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, Handshake, BarChart2, GraduationCap, Lightbulb } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TipTapImage from '@tiptap/extension-image'
import TipTapLink from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'

const iconMap: Record<string, React.ElementType> = { Users, TrendingUp, Handshake, BarChart2, GraduationCap, Lightbulb }

async function fetchAbout() {
  const { data } = await supabase.from('home_content').select('*')
    .in('section', ['about', 'benefits', 'stats', 'quem_somos_missao', 'quem_somos_historia', 'cta'])
    .order('updated_at')
  const map: Record<string, Record<string, unknown>> = {}
  for (const row of data ?? []) map[row.section] = row.content
  return map
}

const defaultMissaoCards = [
  { title: 'Missão', text: 'Unir empresários do setor para gerar crescimento coletivo e individual por meio de colaboração e conhecimento compartilhado.' },
  { title: 'Visão', text: 'Ser reconhecido como o mais sólido e influente grupo empresarial do setor de materiais de construção do interior paulista.' },
  { title: 'Valores', text: 'Transparência, colaboração, inovação, excelência e respeito mútuo entre todos os membros e parceiros do grupo.' },
]

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }) }

export default function QuemSomosPage() {
  const { data: sections = {} } = useQuery({ queryKey: ['quem-somos-content'], queryFn: fetchAbout })
  const about = sections.about as Record<string, string> | undefined
  const benefits = (sections.benefits as { items?: Array<{ icon: string; title: string; description: string }> } | undefined)?.items ?? []
  const stats = (sections.stats as { items?: Array<{ value: string; label: string; suffix?: string }> } | undefined)?.items ?? []

  const missao = sections.quem_somos_missao as { title?: string; cards?: Array<{ title: string; text: string }> } | undefined
  const missaoTitle = missao?.title ?? 'Fortalecer empresas do setor de materiais de construção através da colaboração, conhecimento e inovação.'
  const missaoCards = missao?.cards && missao.cards.length > 0 ? missao.cards : defaultMissaoCards

  const historia = sections.quem_somos_historia as { title?: string; description?: string; description_json?: Record<string, unknown> } | undefined
  const historiaTitle = historia?.title ?? 'Nossa história em construção.'
  const historiaFallback = 'Estamos organizando os marcos da trajetória do Grupo GCasa para contar essa história aqui em breve.'
  let historiaHtml = ''
  try {
    if (historia?.description_json) {
      historiaHtml = generateHTML(historia.description_json as Parameters<typeof generateHTML>[0], [StarterKit, TipTapImage, TipTapLink, TextAlign])
    }
  } catch { historiaHtml = '' }

  const cta = sections.cta as { title?: string; description?: string } | undefined
  const ctaTitle = cta?.title ?? 'Pronto para crescer junto com a gente?'
  const ctaDescription = cta?.description ?? 'Associe-se ao Grupo GCasa e tenha acesso a uma rede que move o setor.'

  return (
    <div className="pt-16 min-h-screen">
      <div className="texture-concrete texture-concrete--dark bg-graphite-900 py-16 lg:py-24">
        <div className="container-site">
          <div className="max-w-2xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="section-label-light">Quem Somos</span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp} className="text-4xl md:text-6xl heading-editorial text-white mt-4">
              {about?.title ?? 'Crescemos quando'}<br />
              <span className="text-primary-500">{about?.title_highlight ?? 'crescemos juntos.'}</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp} className="text-graphite-300 text-lg mt-6 leading-relaxed">
              {about?.description ?? 'A união de empresários fortes cria um ecossistema que gera desenvolvimento, inovação e novas oportunidades para todos.'}
            </motion.p>
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="bg-graphite-900 border-t border-white/10 py-12">
          <div className="container-site">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className="text-4xl heading-editorial text-white">{s.value}{s.suffix}</p>
                  <p className="text-graphite-300 text-sm mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div id="missao" className="py-20 bg-offwhite scroll-mt-20">
        <div className="container-site">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="section-label">Nossa Missão</span>
            <h2 className="text-3xl heading-editorial text-graphite-900 mt-4">{missaoTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {missaoCards.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white shadow-card p-6">
                <h3 className="text-lg font-bold text-graphite-900 mb-3">{item.title}</h3>
                <p className="text-graphite-600 text-sm leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div id="historia" className="py-20 bg-white scroll-mt-20">
        <div className="container-site">
          <div className="max-w-2xl mx-auto text-center">
            <span className="section-label">Linha do Tempo</span>
            <h2 className="text-3xl heading-editorial text-graphite-900 mt-4">{historiaTitle}</h2>
          </div>
          <div className="max-w-2xl mx-auto mt-4">
            {historiaHtml ? (
              <div
                className="prose prose-gray max-w-none text-graphite-600 leading-relaxed [&_p]:my-3"
                dangerouslySetInnerHTML={{ __html: historiaHtml }}
              />
            ) : (
              <p className="text-graphite-600 leading-relaxed whitespace-pre-line">
                {historia?.description || historiaFallback}
              </p>
            )}
          </div>
        </div>
      </div>

      {benefits.length > 0 && (
        <div id="beneficios" className="py-20 bg-offwhite scroll-mt-20">
          <div className="container-site">
            <div className="text-center mb-12">
              <span className="section-label">Benefícios</span>
              <h2 className="text-3xl heading-editorial text-graphite-900 mt-4">Vantagens reais para associados.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => {
                const Icon = iconMap[b.icon] ?? TrendingUp
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    className="bg-white shadow-card p-6">
                    <div className="w-10 h-10 bg-primary-50 flex items-center justify-center mb-4"><Icon size={18} className="text-primary-500" /></div>
                    <h3 className="font-bold text-graphite-900 mb-2">{b.title}</h3>
                    <p className="text-graphite-600 text-sm">{b.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="texture-concrete texture-concrete--dark bg-graphite-900 py-20 text-center">
        <div className="container-site max-w-2xl">
          <span className="section-label-light">Faça parte</span>
          <h2 className="text-3xl md:text-4xl heading-editorial text-white mt-4">{ctaTitle}</h2>
          <p className="text-graphite-300 mt-4">{ctaDescription}</p>
          <div className="flex gap-4 justify-center mt-8">
            <Link to="/quero-me-associar" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 font-bold transition-colors">Quero me associar</Link>
            <Link to="/contato" className="border-2 border-white/30 text-white px-6 py-3 font-bold hover:border-primary-400 hover:text-primary-400 transition-colors">Falar com a equipe</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
