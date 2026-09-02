import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { GcasaEvent } from '@/types/models'

async function fetchEvents(): Promise<GcasaEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('date', { ascending: false })
  if (error) throw error
  return data as GcasaEvent[]
}

export default function EventosPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ['events-public'], queryFn: fetchEvents })

  return (
    <div className="pt-16 min-h-screen bg-offwhite">
      <div className="texture-concrete texture-concrete--dark bg-graphite-900 py-20">
        <div className="container-site text-center">
          <span className="section-label-light">Eventos e Capacitações</span>
          <h1 className="text-4xl md:text-5xl heading-editorial text-white mt-4">
            Conhecimento que<br />
            <span className="text-primary-500">gera resultado</span>
          </h1>
          <p className="text-graphite-300 mt-4 max-w-xl mx-auto">
            Encontros, feiras, missões técnicas e treinamentos que impulsionam os negócios do Grupo GCasa.
          </p>
        </div>
      </div>

      <div className="container-site py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white overflow-hidden animate-pulse">
                <div className="h-44 bg-graphite-100" />
                <div className="p-6">
                  <div className="h-4 bg-graphite-100 w-3/4 mb-2" />
                  <div className="h-3 bg-graphite-100 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-graphite-400">Nenhum evento publicado no momento.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/eventos/${event.slug}`} className="group block bg-white overflow-hidden shadow-card hover:shadow-dropdown transition-all duration-300 hover:-translate-y-1">
                  <div className="h-44 bg-graphite-100 overflow-hidden">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-graphite-100 to-graphite-200 flex items-center justify-center">
                        <Calendar size={28} className="text-graphite-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {event.date && (
                      <span className="flex items-center gap-1 text-xs font-bold text-primary-500 mb-2">
                        <Calendar size={12} />{formatDate(event.date)}
                      </span>
                    )}
                    <h3 className="font-bold text-graphite-900 group-hover:text-primary-600 transition-colors line-clamp-2">{event.title}</h3>
                    {event.location && (
                      <p className="text-sm text-graphite-500 flex items-center gap-1 mt-2">
                        <MapPin size={12} />{event.location}
                      </p>
                    )}
                    <div className="mt-4 flex items-center text-xs text-primary-600 font-bold gap-1 group-hover:gap-2 transition-all">
                      Saiba mais <ArrowRight size={12} />
                    </div>
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
