import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import type { BlogPost } from '@/types/models'

async function fetchPosts(): Promise<BlogPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_url, published_at, read_time, category:categories(name, slug)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)
  return (data ?? []) as BlogPost[]
}

export function BlogSection() {
  const { data: posts = [] } = useQuery({ queryKey: ['blog-home'], queryFn: fetchPosts })

  if (posts.length === 0) return null

  const [main, ...rest] = posts

  return (
    <section className="py-24 bg-white">
      <div className="container-site">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <span className="section-label mb-4 block">INSIGHTS PARA O SETOR</span>
            <h2 className="text-3xl lg:text-4xl heading-editorial text-graphite-900 text-balance">
              Conteúdos que<br />inspiram e informam.
            </h2>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-graphite-700 hover:text-primary-600 border-b border-graphite-300 hover:border-primary-400 pb-0.5 transition-colors self-start lg:self-auto whitespace-nowrap"
          >
            Ver todos os conteúdos <ArrowRight size={13} />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-[1fr_380px] gap-6"
        >
          {/* Main post */}
          <Link
            to={`/blog/${main.slug}`}
            className="group block bg-graphite-50 overflow-hidden"
          >
            <div className="aspect-[16/9] bg-graphite-100 overflow-hidden">
              {main.cover_url ? (
                <img src={main.cover_url} alt={main.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-graphite-100 to-graphite-50 flex items-center justify-center">
                  <span className="text-6xl heading-editorial text-graphite-200">{main.title[0]}</span>
                </div>
              )}
            </div>
            <div className="p-6">
              {main.category && (
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary-500 mb-2 block">{main.category.name}</span>
              )}
              <h3 className="text-xl heading-editorial text-graphite-900 line-clamp-2 group-hover:text-primary-600 transition-colors">{main.title}</h3>
              {main.excerpt && <p className="text-sm text-graphite-500 mt-2 line-clamp-2 font-light">{main.excerpt}</p>}
              <div className="flex items-center gap-3 mt-4 text-[0.7rem] text-graphite-400">
                {main.published_at && <span>{formatDateShort(main.published_at)}</span>}
                {main.read_time && <span className="flex items-center gap-1"><Clock size={10} /> {main.read_time} min</span>}
              </div>
            </div>
          </Link>

          {/* Secondary posts */}
          <div className="flex flex-col gap-0 divide-y divide-graphite-100">
            {rest.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="group flex gap-4 py-5 first:pt-0 last:pb-0 hover:bg-offwhite -mx-4 px-4 transition-colors">
                <div className="w-20 h-20 flex-shrink-0 bg-graphite-100 overflow-hidden">
                  {post.cover_url ? (
                    <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-graphite-50 flex items-center justify-center">
                      <span className="text-2xl heading-editorial text-graphite-300">{post.title[0]}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {post.category && (
                    <span className="text-[0.6rem] font-bold uppercase tracking-widest text-primary-500 mb-1 block">{post.category.name}</span>
                  )}
                  <h3 className="text-sm heading-editorial text-graphite-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-[0.65rem] text-graphite-400">
                    {post.published_at && <span>{formatDateShort(post.published_at)}</span>}
                    {post.read_time && <span>{post.read_time} min</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
