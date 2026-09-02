import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export type Banner = {
  id: string
  text: string
  link_label?: string | null
  link_href?: string | null
  bg_color?: string | null
  text_color?: string | null
  image_url?: string | null
  active: boolean
  order_index: number
}

async function fetchBanners(): Promise<Banner[]> {
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('order_index')
  return (data ?? []) as Banner[]
}

export function TopBanner() {
  const [index, setIndex] = useState(0)

  const { data: banners = [] } = useQuery({
    queryKey: ['top-banners'],
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000,
  })

  const visible = banners.length > 0

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  if (!visible) return null

  const banner = banners[index]
  const isExternal = banner.link_href?.startsWith('http')

  return (
    <div className="relative w-full overflow-hidden">
      {/* ghost element maintains container height during slide transition */}
      <div className="invisible w-full" aria-hidden="true">
        {banner.image_url ? (
          <img src={banner.image_url} alt="" className="w-full block" />
        ) : (
          <div className="w-full" style={{ height: 80 }} />
        )}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key={banner.id}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="absolute inset-0 w-full"
        >
          {banner.image_url ? (
            <img src={banner.image_url} alt="" className="w-full block" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: banner.bg_color ?? '#FAB136' }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* clickable overlay if link exists */}
      {banner.link_href && (
        isExternal ? (
          <a href={banner.link_href} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" aria-label="Ver mais" />
        ) : (
          <Link to={banner.link_href} className="absolute inset-0 z-10" aria-label="Ver mais" />
        )
      )}

      {banners.length > 1 && (
        <span className="absolute bottom-2 right-10 z-10 text-[10px] text-white/60 tabular-nums bg-black/30 px-1.5 py-0.5 rounded">
          {index + 1}/{banners.length}
        </span>
      )}
    </div>
  )
}
