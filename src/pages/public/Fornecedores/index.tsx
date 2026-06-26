import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/types/models'

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*, category:categories(id, name, slug, type)')
    .eq('active', true)
    .order('order_index')
  if (error) throw error
  return data as Supplier[]
}

export default function FornecedoresPage() {
  const [search, setSearch] = useState('')
  const { data = [], isLoading } = useQuery({ queryKey: ['suppliers-public'], queryFn: fetchSuppliers })

  const featured = data.filter(s => s.featured)
  const rest = data.filter(s => !s.featured)

  const filterFn = (s: Supplier) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category?.name ?? '').toLowerCase().includes(search.toLowerCase())

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-dark-900 py-20">
        <div className="container-site text-center">
          <span className="section-label text-red-400">Fornecedores</span>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white mt-4">
            Marcas parceiras do<br /><span className="text-primary-600">Grupo GCasa</span>
          </h1>
          <p className="text-gray-400 mt-4 max-w-md mx-auto">Conheça as empresas que fornecem produtos e serviços para todo o nosso grupo.</p>
          <div className="mt-8 relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar fornecedor..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary-600 transition-colors text-sm" />
          </div>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : (
          <>
            {featured.filter(filterFn).length > 0 && (
              <div className="mb-12">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Parceiros em Destaque</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {featured.filter(filterFn).map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      {s.site_url ? (
                        <a href={s.site_url} target="_blank" rel="noreferrer"
                          className="group flex flex-col items-center gap-3 bg-white rounded-2xl p-6 shadow-card hover:shadow-dropdown transition-all duration-300 hover:-translate-y-1">
                          <div className="w-16 h-16 flex items-center justify-center">
                            {s.logo_url ? <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" /> : <span className="text-2xl font-bold text-gray-300">{s.name[0]}</span>}
                          </div>
                          <p className="text-xs font-medium text-gray-600 text-center">{s.name}</p>
                          <ExternalLink size={12} className="text-gray-300 group-hover:text-primary-600 transition-colors" />
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-3 bg-white rounded-2xl p-6 shadow-card">
                          <div className="w-16 h-16 flex items-center justify-center">
                            {s.logo_url ? <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" /> : <span className="text-2xl font-bold text-gray-300">{s.name[0]}</span>}
                          </div>
                          <p className="text-xs font-medium text-gray-600 text-center">{s.name}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {rest.filter(filterFn).length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Todos os Fornecedores</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {rest.filter(filterFn).map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      {s.site_url ? (
                        <a href={s.site_url} target="_blank" rel="noreferrer"
                          className="group flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-card hover:shadow-dropdown transition-all duration-300 hover:-translate-y-0.5">
                          <div className="w-12 h-12 flex items-center justify-center">
                            {s.logo_url ? <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" /> : <span className="text-lg font-bold text-gray-300">{s.name[0]}</span>}
                          </div>
                          <p className="text-xs text-gray-500 text-center line-clamp-1">{s.name}</p>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-card">
                          <div className="w-12 h-12 flex items-center justify-center">
                            {s.logo_url ? <img src={s.logo_url} alt={s.name} className="max-w-full max-h-full object-contain" /> : <span className="text-lg font-bold text-gray-300">{s.name[0]}</span>}
                          </div>
                          <p className="text-xs text-gray-500 text-center line-clamp-1">{s.name}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {data.filter(filterFn).length === 0 && (
              <div className="text-center py-20 text-gray-400">Nenhum fornecedor encontrado.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
