import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
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

const DISMISSED_KEY = 'gcasa-banner-dismissed-v3'

async function fetchBanners(): Promise<Banner[]> {
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('order_index')
  return (data ?? []) as Banner[]
}

export function TopBanner() {
  const [dismissed, setDismissed] = useState(() =>
    sessionStorage.getItem(DISMISSED_KEY) === 'true'
  )
  const [index, setIndex] = useState(0)

  const { data: banners = [] } = useQuery({
    queryKey: ['top-banners'],
    queryFn: fetchBanners,
    staleTime: 5 * 60 * 1000,
  })

  const visible = !dismissed && banners.length > 0

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
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {banner.image_url ? (
            <img
              src={banner.image_url}
              alt=""
              className="w-full block"
            />
          ) : (
            <div
              className="w-full"
              style={{ height: 80, background: banner.bg_color ?? '#E8630A' }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* clickable overlay if link exists */}
      {banner.link_href && (
        isExternal ? (
          <a href={banner.link_href} target="_blank" rel="noreferrer" className="absolute inset-0" aria-label="Ver mais" />
        ) : (
          <Link to={banner.link_href} className="absolute inset-0" aria-label="Ver mais" />
        )
      )}

      {banners.length > 1 && (
        <span className="absolute bottom-2 right-10 text-[10px] text-white/60 tabular-nums bg-black/30 px-1.5 py-0.5 rounded">
          {index + 1}/{banners.length}
        </span>
      )}

      <button
        onClick={() => { setDismissed(true); sessionStorage.setItem(DISMISSED_KEY, 'true') }}
        className="absolute right-3 top-3 z-10 p-1 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
        aria-label="Fechar banner"
      >
        <X size={13} />
      </button>
    </div>
  )
}
