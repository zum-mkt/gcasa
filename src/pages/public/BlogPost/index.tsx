import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { generateHTML } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import TipTapImage from '@tiptap/extension-image'
import TipTapLink from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import type { BlogPost } from '@/types/models'

async function fetchPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:categories(id, name, slug, type), author:profiles(id, name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) return null
  return data as BlogPost
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => fetchPost(slug!),
    enabled: !!slug,
  })

  if (isLoading) return (
    <div className="pt-24 min-h-screen">
      <div className="container-site max-w-3xl py-8 animate-pulse space-y-4">
        <div className="h-6 bg-graphite-100 w-32" />
        <div className="h-10 bg-graphite-100 w-3/4" />
        <div className="h-4 bg-graphite-100 w-1/2" />
        <div className="aspect-video bg-graphite-100" />
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-graphite-100" />)}
      </div>
    </div>
  )

  if (!post) return (
    <div className="pt-24 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl heading-editorial text-graphite-900 mb-4">Artigo não encontrado</h1>
        <Link to="/blog" className="text-primary-600 hover:underline">Voltar ao Blog</Link>
      </div>
    </div>
  )

  let html = ''
  try {
    html = generateHTML(post.content as Parameters<typeof generateHTML>[0], [StarterKit, TipTapImage, TipTapLink, TextAlign])
  } catch { html = '' }

  return (
    <article className="pt-16 min-h-screen">
      <div className="texture-concrete texture-concrete--dark bg-graphite-900 py-16">
        <div className="container-site max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-graphite-300 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft size={14} /> Voltar ao Blog
          </Link>
          {post.category?.name && <span className="section-label-light">{post.category.name}</span>}
          <h1 className="text-3xl md:text-4xl heading-editorial text-white mt-3 mb-4">{post.title}</h1>
          {post.excerpt && <p className="text-graphite-300 text-lg">{post.excerpt}</p>}
          <div className="flex items-center gap-4 mt-6 text-sm text-graphite-300">
            {post.author?.name && <span>{post.author.name}</span>}
            {post.published_at && <span className="flex items-center gap-1"><Calendar size={13} />{formatDate(post.published_at)}</span>}
            {post.read_time && <span className="flex items-center gap-1"><Clock size={13} />{post.read_time} min de leitura</span>}
          </div>
        </div>
      </div>

      {post.cover_url && (
        <div className="container-site max-w-3xl -mt-8">
          <div className="aspect-video overflow-hidden shadow-dropdown">
            <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <div className="container-site max-w-3xl py-12">
        {html ? (
          <div className="prose prose-lg prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="text-graphite-500">Conteúdo não disponível.</p>
        )}
      </div>
    </article>
  )
}
