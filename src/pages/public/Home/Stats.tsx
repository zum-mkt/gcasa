import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Store, Users, Lightbulb, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StatItem } from '@/types/models'
import { useCountUp, revealViewport, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'

const defaultStats: StatItem[] = [
  { value: '10', label: 'Empresas Associadas', suffix: '+' },
  { value: '18', label: 'Lojas' },
  { value: '700', label: 'Colaboradores', suffix: '+' },
  { value: '12', label: 'Anos de História', suffix: '+' },
  { value: 'Milhões', label: 'Em compras anuais' },
]

const statIcons = [Building2, Store, Users, Lightbulb, Wallet]

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
  const { ref, display } = useCountUp(value, suffix)
  return <span ref={ref}>{display}</span>
}

export function Stats() {
  const { data: stats = defaultStats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: fetchStats,
  })

  return (
    <section className="bg-graphite-900">
      <div className="container-site py-12 lg:py-14">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={revealViewport}
          variants={staggerContainer(0.08)}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10"
        >
          {stats.map((stat, i) => {
            const Icon = statIcons[i % statIcons.length]
            return (
              <motion.div key={i} variants={staggerItem} className="flex items-center justify-center gap-3 py-6 px-4">
                <Icon size={20} className="text-primary-500 flex-shrink-0" strokeWidth={1.75} />
                <div className="text-left">
                  <p className="text-2xl md:text-[2rem] heading-editorial text-white tracking-tight">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-[0.68rem] text-white/65 mt-1 tracking-[0.14em] uppercase font-medium">{stat.label}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
