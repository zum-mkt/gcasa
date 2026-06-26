import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import type { GcasaEvent } from '@/types/models'

async function fetchEvents(): Promise<GcasaEvent[]> {
  const { data } = await supabase
    .from('events')
    .select('id, title, slug, date, location, description, image_url')
    .eq('status', 'published')
    .order('date', { ascending: false })
    .limit(5)
  return (data ?? []) as GcasaEvent[]
}

function EventCard({ event, large = false }: { event: GcasaEvent; large?: boolean }) {
  return (
    <Link
      to={`/eventos/${event.slug}`}
      className={`group relative overflow-hidden block bg-graphite-100 ${large ? 'h-[480px]' : 'h-[228px]'}`}
    >
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-graphite-200 to-graphite-100" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/80 via-graphite-900/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        {event.date && (
          <span className="text-[0.6rem] text-primary-400 font-bold tracking-widest uppercase mb-2 block">
            {formatDateShort(event.date)}
          </span>
        )}
        <h3 className={`heading-editorial text-white text-balance leading-tight ${large ? 'text-xl' : 'text-sm'}`}>
          {event.title}
        </h3>
        {event.location && (
          <p className="flex items-center gap-1 text-[0.65rem] text-white/40 mt-2">
            <MapPin size={9} />
            {event.location}
          </p>
        )}
        <span className="inline-flex items-center gap-1.5 mt-3 text-[0.65rem] text-white/60 group-hover:text-primary-400 font-semibold tracking-wider uppercase transition-colors">
          Saiba mais <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  )
}

export function EventsSection() {
  const { data: events = [] } = useQuery({ queryKey: ['events-home'], queryFn: fetchEvents })

  const [main, ...rest] = events
  const secondaries = rest.slice(0, 4)

  return (
    <section className="py-24 bg-offwhite">
      <div className="container-site">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <span className="section-label mb-4 block">EVENTOS E CAPACITAÇÕES</span>
            <h2 className="text-3xl lg:text-4xl heading-editorial text-graphite-900 text-balance">
              Conhecimento que<br />gera resultado.
            </h2>
          </div>
          <Link
            to="/eventos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-graphite-700 hover:text-primary-600 border-b border-graphite-300 hover:border-primary-400 pb-0.5 transition-colors self-start lg:self-auto"
          >
            Ver todos os eventos <ArrowRight size={13} />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-1">
            <div className="bg-graphite-100 h-[480px] animate-pulse" />
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-graphite-100 h-[228px] animate-pulse" />)}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-1"
          >
            {main && <EventCard event={main} large />}
            {secondaries.length > 0 && (
              <div className="grid grid-cols-2 gap-1">
                {secondaries.map((ev) => <EventCard key={ev.id} event={ev} />)}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
