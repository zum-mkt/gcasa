import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StatItem } from '@/types/models'

const defaultStats: StatItem[] = [
  { value: '10', label: 'Empresas Associadas', suffix: '+' },
  { value: '18', label: 'Lojas' },
  { value: '700', label: 'Colaboradores', suffix: '+' },
  { value: '12', label: 'Anos de História', suffix: '+' },
  { value: 'Milhões', label: 'Em compras anuais' },
]

async function fetchStats(): Promise<StatItem[]> {
  const { data } = await supabase
    .from('home_content')
    .select('content')
    .eq('section', 'stats')
    .single()
  if (!data) return defaultStats
  return (data.content as { items: StatItem[] }).items ?? defaultStats
}

function AnimatedNumber({ value, suffix }: { value: string; suffix?: string }) {
  const [displayed, setDisplayed] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const numeric = parseInt(value.replace(/\D/g, ''), 10)
  const isNumeric = !isNaN(numeric)

  useEffect(() => {
    if (!isNumeric) { setDisplayed(value); return }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        let start = 0
        const duration = 1200
        const step = duration / numeric
        const timer = setInterval(() => {
          start += 1
          setDisplayed(String(start))
          if (start >= numeric) clearInterval(timer)
        }, step)
        observer.disconnect()
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [numeric, isNumeric, value])

  return (
    <span ref={ref}>
      {isNumeric ? displayed : value}
      {suffix}
    </span>
  )
}

export function Stats() {
  const { data: stats = defaultStats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: fetchStats,
  })

  return (
    <section className="bg-offwhite border-b border-graphite-100">
      <div className="container-site py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-graphite-100">
          {stats.map((stat, i) => (
            <div key={i} className="text-center py-6 px-4">
              <p className="text-3xl md:text-4xl heading-editorial text-graphite-900 tracking-tight">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[0.65rem] text-graphite-400 mt-1.5 tracking-widest uppercase font-light">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
