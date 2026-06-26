import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, TrendingUp, Handshake, BarChart2, GraduationCap, Lightbulb } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const iconMap: Record<string, React.ElementType> = { Users, TrendingUp, Handshake, BarChart2, GraduationCap, Lightbulb }

async function fetchAbout() {
  const { data } = await supabase.from('home_content').select('*').in('section', ['about', 'benefits', 'stats']).order('updated_at')
  const map: Record<string, Record<string, unknown>> = {}
  for (const row of data ?? []) map[row.section] = row.content
  return map
}

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }) }

export default function QuemSomosPage() {
  const { data: sections = {} } = useQuery({ queryKey: ['quem-somos-content'], queryFn: fetchAbout })
  const about = sections.about as Record<string, string> | undefined
  const benefits = (sections.benefits as { items?: Array<{ icon: string; title: string; description: string }> } | undefined)?.items ?? []
  const stats = (sections.stats as { items?: Array<{ value: string; label: string; suffix?: string }> } | undefined)?.items ?? []

  return (
    <div className="pt-16 min-h-screen">
      <div className="bg-dark-900 py-24">
        <div className="container-site">
          <div className="max-w-2xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="section-label text-red-400">Quem Somos</span>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" custom={1} variants={fadeUp} className="text-4xl md:text-6xl font-display font-light text-white mt-4">
              {about?.title ?? 'Crescemos quando'}<br />
              <span className="text-primary-600">{about?.title_highlight ?? 'crescemos juntos.'}</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" custom={2} variants={fadeUp} className="text-gray-400 text-lg mt-6 leading-relaxed">
              {about?.description ?? 'A união de empresários fortes cria um ecossistema que gera desenvolvimento, inovação e novas oportunidades para todos.'}
            </motion.p>
          </div>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="bg-primary-600 py-12">
          <div className="container-site">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <p className="text-4xl font-display font-light text-white">{s.value}{s.suffix}</p>
                  <p className="text-red-200 text-sm mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="py-20 bg-white">
        <div className="container-site">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="section-label">Nossa Missão</span>
            <h2 className="text-3xl font-display font-light text-dark-900 mt-4">Fortalecer empresas do setor de materiais de construção através da colaboração, conhecimento e inovação.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              { title: 'Missão', text: 'Unir empresários do setor para gerar crescimento coletivo e individual por meio de colaboração e conhecimento compartilhado.' },
              { title: 'Visão', text: 'Ser reconhecido como o mais sólido e influente grupo empresarial do setor de materiais de construção do interior paulista.' },
              { title: 'Valores', text: 'Transparência, colaboração, inovação, excelência e respeito mútuo entre todos os membros e parceiros do grupo.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {benefits.length > 0 && (
        <div className="py-20 bg-gray-50">
          <div className="container-site">
            <div className="text-center mb-12">
              <span className="section-label">Benefícios</span>
              <h2 className="text-3xl font-display font-light text-dark-900 mt-4">Vantagens reais para associados.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => {
                const Icon = iconMap[b.icon] ?? TrendingUp
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-6 shadow-card">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-4"><Icon size={18} className="text-primary-600" /></div>
                    <h3 className="font-semibold text-gray-900 mb-2">{b.title}</h3>
                    <p className="text-gray-500 text-sm">{b.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="py-20 bg-dark-900 text-center">
        <div className="container-site max-w-2xl">
          <span className="section-label text-red-400">Faça parte</span>
          <h2 className="text-3xl md:text-4xl font-display font-light text-white mt-4">Pronto para crescer junto com a gente?</h2>
          <p className="text-gray-400 mt-4">Associe-se ao Grupo GCasa e tenha acesso a uma rede que move o setor.</p>
          <div className="flex gap-4 justify-center mt-8">
            <Link to="/quero-me-associar" className="bg-primary-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors">Quero me associar</Link>
            <Link to="/contato" className="border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors">Falar com a equipe</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
