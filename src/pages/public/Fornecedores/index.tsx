import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Supplier } from '@/types/models'
import { FornecedorModal } from '@/components/public/FornecedorModal'

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*, category:categories(id, name, slug, type)')
    .eq('active', true)
    .order('order_index')
  if (error) throw error
  return data as Supplier[]
}

function SupplierCard({ supplier, onClick }: { supplier: Supplier; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left flex flex-col items-center gap-3 bg-white p-6 shadow-card hover:shadow-dropdown transition-all duration-300 hover:-translate-y-1"
    >
      <div className="w-16 h-16 flex items-center justify-center">
        {supplier.logo_url
          ? <img src={supplier.logo_url} alt={supplier.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
          : <span className="text-2xl heading-editorial text-graphite-300">{supplier.name[0]}</span>
        }
      </div>
      <p className="text-xs font-bold text-graphite-600 text-center leading-tight">{supplier.name}</p>
      {supplier.category && (
        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-primary-500">{supplier.category.name}</p>
      )}
    </button>
  )
}

export default function FornecedoresPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Supplier | null>(null)
  const { data = [], isLoading } = useQuery({ queryKey: ['suppliers-public'], queryFn: fetchSuppliers })

  const featured = data.filter(s => s.featured)
  const rest = data.filter(s => !s.featured)

  const filterFn = (s: Supplier) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category?.name ?? '').toLowerCase().includes(search.toLowerCase())

  return (
    <div className="pt-16 min-h-screen bg-offwhite">
      <div className="texture-concrete texture-concrete--dark bg-graphite-900 py-20">
        <div className="container-site text-center">
          <span className="section-label-light">Fornecedores</span>
          <h1 className="text-4xl md:text-5xl heading-editorial text-white mt-4">
            Marcas parceiras do<br /><span className="text-primary-500">Grupo GCasa</span>
          </h1>
          <p className="text-graphite-300 mt-4 max-w-md mx-auto">Conheça as empresas que fornecem produtos e serviços para todo o nosso grupo.</p>
          <div className="mt-8 relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar fornecedor..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder-graphite-400 focus:outline-none focus:border-primary-500 transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {featured.filter(filterFn).length > 0 && (
              <div className="mb-12">
                <h2 className="text-xs font-bold uppercase tracking-widest text-graphite-400 mb-6">Parceiros em Destaque</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {featured.filter(filterFn).map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <SupplierCard supplier={s} onClick={() => setSelected(s)} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {rest.filter(filterFn).length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-graphite-400 mb-6">Todos os Fornecedores</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {rest.filter(filterFn).map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <SupplierCard supplier={s} onClick={() => setSelected(s)} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {data.filter(filterFn).length === 0 && (
              <div className="text-center py-20 text-graphite-400">Nenhum fornecedor encontrado.</div>
            )}
          </>
        )}
      </div>

      <FornecedorModal supplier={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
