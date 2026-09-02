import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { GcasaEvent } from '@/types/models'

async function fetchEvent(slug: string): Promise<GcasaEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) return null
  return data as GcasaEvent
}

export default function EventoDetalhePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: event, isLoading } = useQuery({
    queryKey: ['evento-detalhe', slug],
    queryFn: () => fetchEvent(slug!),
    enabled: !!slug,
  })

  if (isLoading) return (
    <div className="pt-16 min-h-screen">
      <div className="container-site max-w-3xl py-16 animate-pulse space-y-4">
        <div className="h-4 bg-graphite-100 w-32" />
        <div className="h-10 bg-graphite-100 w-3/4" />
        <div className="h-4 bg-graphite-100 w-1/2" />
        <div className="aspect-video bg-graphite-100" />
      </div>
    </div>
  )

  if (!event) return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl heading-editorial text-graphite-900 mb-4">Evento não encontrado</h1>
        <Link to="/eventos" className="text-primary-600 hover:underline text-sm">Voltar aos eventos</Link>
      </div>
    </div>
  )

  return (
    <article className="pt-16 min-h-screen">
      <div className="bg-offwhite py-16 border-b border-graphite-100">
        <div className="container-site max-w-3xl">
          <Link to="/eventos" className="flex w-fit items-center gap-2 text-graphite-500 hover:text-primary-600 transition-colors text-sm mb-6">
            <ArrowLeft size={14} /> Voltar aos eventos
          </Link>
          <span className="section-label mb-3 block">Evento</span>
          <h1 className="text-3xl md:text-4xl heading-editorial text-graphite-900 text-balance">{event.title}</h1>

          <div className="flex flex-wrap items-center gap-5 mt-6 text-sm text-graphite-500">
            {event.date && (
              <span className="flex items-center gap-2">
                <Calendar size={14} className="text-primary-500" />
                {formatDate(event.date)}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-primary-500" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {event.image_url && (
        <div className="container-site max-w-3xl -mt-8">
          <div className="aspect-video overflow-hidden shadow-card">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      <div className="container-site max-w-3xl py-12">
        {event.description ? (
          <p className="text-graphite-600 leading-relaxed whitespace-pre-line">{event.description}</p>
        ) : (
          <p className="text-graphite-400">Detalhes em breve.</p>
        )}

        {event.gallery && event.gallery.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xs font-semibold text-graphite-400 uppercase tracking-widest mb-4">Galeria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {event.gallery.map((url, i) => (
                <div key={i} className="aspect-square bg-graphite-100 overflow-hidden">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
