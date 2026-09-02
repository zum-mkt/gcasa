import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MapPin, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { formatDateShort } from '@/lib/utils'
import type { GcasaEvent } from '@/types/models'
import { revealViewport, slideLeft, staggerContainer, staggerItem, hoverLiftGold } from '@/hooks/useScrollAnimation'

const MotionLink = motion(Link)

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
    <MotionLink
      variants={staggerItem}
      to={`/eventos/${event.slug}`}
      className={`group relative overflow-hidden block bg-graphite-100 ${hoverLiftGold} ${large ? 'h-[480px]' : 'h-[228px]'}`}
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
          <span className="text-sm text-primary-400 font-extrabold mb-2 block">
            {formatDateShort(event.date)}
          </span>
        )}
        <h3 className={`heading-editorial text-white text-balance leading-tight ${large ? 'text-3xl' : 'text-lg'}`}>
          {event.title}
        </h3>
        {event.location && (
          <p className="flex items-center gap-1.5 text-sm text-white font-bold mt-2">
            <MapPin size={14} />
            {event.location}
          </p>
        )}
        <span className="inline-flex items-center gap-1.5 mt-3 text-base text-white group-hover:text-primary-400 font-extrabold transition-colors">
          Ver evento <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </MotionLink>
  )
}

export function EventsSection() {
  const { data: events = [], isLoading } = useQuery({ queryKey: ['events-home'], queryFn: fetchEvents })

  if (!isLoading && events.length === 0) return null

  const [main, ...rest] = events
  const secondaries = rest.slice(0, 4)

  return (
    <section id="eventos" className="py-16 lg:py-20 bg-offwhite scroll-mt-20">
      <div className="container-site">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={slideLeft}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10"
        >
          <div>
            <span className="section-label mb-4 block">EVENTOS E CAPACITAÇÕES</span>
            <h2 className="text-3xl lg:text-[2.75rem] heading-editorial text-graphite-900 text-balance">
              Treinamentos e encontros do grupo.
            </h2>
          </div>
          <Link
            to="/eventos"
            className="inline-flex items-center gap-2 text-lg font-extrabold text-graphite-900 hover:text-primary-600 border-b-4 border-primary-500 pb-0.5 transition-colors self-start lg:self-auto"
          >
            Ver todos os eventos <ArrowRight size={20} />
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-1">
            <div className="bg-graphite-100 h-[480px] animate-pulse" />
            <div className="grid grid-cols-2 gap-1">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-graphite-100 h-[228px] animate-pulse" />)}
            </div>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={revealViewport}
            variants={staggerContainer(0.1)}
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
