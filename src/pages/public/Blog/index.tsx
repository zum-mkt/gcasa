import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Clock, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import type { BlogPost } from '@/types/models'

async function fetchPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:categories(id, name, slug, type)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) throw error
  return data as BlogPost[]
}

export default function BlogPage() {
  const [search, setSearch] = useState('')
  const { data = [], isLoading } = useQuery({ queryKey: ['blog-public'], queryFn: fetchPosts })
  const filtered = data.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt ?? '').toLowerCase().includes(search.toLowerCase()))
  const [featured, ...rest] = filtered

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="bg-dark-900 py-20">
        <div className="container-site text-center">
          <span className="section-label text-red-400">Blog & Conteúdo</span>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white mt-4">Insights do setor de<br /><span className="text-primary-600">construção e varejo</span></h1>
          <div className="mt-8 relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artigos..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-primary-600 transition-colors text-sm" />
          </div>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Nenhum artigo encontrado.</div>
        ) : (
          <div className="space-y-6">
            {featured && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to={`/blog/${featured.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-dropdown transition-all duration-300">
                  <div className="grid md:grid-cols-2">
                    <div className="aspect-video md:aspect-auto bg-gray-100 overflow-hidden">
                      {featured.cover_url ? <img src={featured.cover_url} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full bg-gradient-to-br from-primary-600 to-dark-900" />}
                    </div>
                    <div className="p-8 flex flex-col justify-center">
                      {featured.category?.name && <span className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-3">{featured.category.name}</span>}
                      <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-3">{featured.title}</h2>
                      <p className="text-gray-500 text-sm line-clamp-3">{featured.excerpt}</p>
                      <div className="flex items-center gap-4 mt-6 text-xs text-gray-400">
                        {featured.published_at && <span>{formatDateShort(featured.published_at)}</span>}
                        {featured.read_time && <span className="flex items-center gap-1"><Clock size={11} />{featured.read_time} min de leitura</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rest.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/blog/${post.slug}`} className="group block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-dropdown transition-all duration-300 hover:-translate-y-1 h-full">
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      {post.cover_url ? <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300 font-bold text-2xl">{post.title[0]}</div>}
                    </div>
                    <div className="p-5">
                      {post.category?.name && <span className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-2 block">{post.category.name}</span>}
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">{post.title}</h3>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                        {post.published_at && <span>{formatDateShort(post.published_at)}</span>}
                        {post.read_time && <span className="flex items-center gap-1"><Clock size={11} />{post.read_time} min</span>}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
