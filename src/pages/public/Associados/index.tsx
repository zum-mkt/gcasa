import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin, ExternalLink, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Associate } from '@/types/models'

async function fetchAssociates(): Promise<Associate[]> {
  const { data, error } = await supabase
    .from('associates')
    .select('*, category:categories(id, name, slug, type)')
    .eq('active', true)
    .order('order_index')
  if (error) throw error
  return data as Associate[]
}

export default function AssociadosPage() {
  const [search, setSearch] = useState('')
  const { data = [], isLoading } = useQuery({ queryKey: ['associates-public'], queryFn: fetchAssociates })

  const filtered = data.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-dark-900 py-20">
        <div className="container-site text-center">
          <span className="section-label text-red-400">Nossos Associados</span>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white mt-4">
            Empresas que fazem parte<br />
            <span className="text-primary-600">do nosso grupo</span>
          </h1>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto">
            Conheça as empresas que compõem o Grupo GCasa e veja como cada uma contribui para um setor mais forte.
          </p>
          <div className="mt-8 relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou cidade..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary-600 transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="w-16 h-16 bg-gray-100 rounded-xl mb-4" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Nenhuma empresa encontrada.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/associados/${a.slug}`} className="group block bg-white rounded-2xl p-6 shadow-card hover:shadow-dropdown transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {a.logo_url ? <img src={a.logo_url} alt={a.name} className="w-full h-full object-contain p-2" /> : <span className="text-2xl font-bold text-gray-300">{a.name[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{a.name}</h3>
                      {a.city && <p className="text-sm text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12} />{a.city}, {a.state}</p>}
                      {a.category?.name && <span className="inline-block mt-2 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.category.name}</span>}
                    </div>
                  </div>
                  {a.description && <p className="text-sm text-gray-500 line-clamp-2">{a.description}</p>}
                  <div className="mt-4 flex items-center text-xs text-primary-600 font-medium gap-1 group-hover:gap-2 transition-all">
                    Ver perfil <ExternalLink size={12} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
