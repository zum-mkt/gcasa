import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight } from 'lucide-react'
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
  const bg = banner.bg_color ?? '#E8630A'
  const fg = banner.text_color ?? '#ffffff'
  const isExternal = banner.link_href?.startsWith('http')
  const hasImage = !!banner.image_url
  const hasText = !!banner.text

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 80 }}>
      {hasImage ? (
        <img
          src={banner.image_url!}
          alt={banner.text || ''}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: bg }} />
      )}

      {hasText && (
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="relative h-full flex items-center justify-center gap-3 px-12"
            style={{ color: fg, textShadow: hasImage ? '0 1px 3px rgba(0,0,0,0.6)' : undefined }}
          >
            {hasImage && <div className="absolute inset-0 bg-black/30 pointer-events-none" />}
            <span className="relative text-sm font-semibold">{banner.text}</span>

            {banner.link_href && banner.link_label && (
              isExternal ? (
                <a
                  href={banner.link_href}
                  target="_blank"
                  rel="noreferrer"
                  className="relative inline-flex items-center gap-1 text-sm font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  style={{ color: fg }}
                >
                  {banner.link_label} <ArrowRight size={12} />
                </a>
              ) : (
                <Link
                  to={banner.link_href}
                  className="relative inline-flex items-center gap-1 text-sm font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  style={{ color: fg }}
                >
                  {banner.link_label} <ArrowRight size={12} />
                </Link>
              )
            )}

            {banners.length > 1 && (
              <span className="relative opacity-50 text-xs tabular-nums">
                {index + 1}/{banners.length}
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {!hasText && banner.link_href && (
        isExternal ? (
          <a href={banner.link_href} target="_blank" rel="noreferrer" className="absolute inset-0" aria-label={banner.link_label ?? 'Ver mais'} />
        ) : (
          <Link to={banner.link_href} className="absolute inset-0" aria-label={banner.link_label ?? 'Ver mais'} />
        )
      )}

      <button
        onClick={() => { setDismissed(true); sessionStorage.setItem(DISMISSED_KEY, 'true') }}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        aria-label="Fechar banner"
      >
        <X size={13} />
      </button>
    </div>
  )
}
