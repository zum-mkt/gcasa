import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUiStore } from '@/stores/uiStore'
import type { HeroContent } from '@/types/models'

async function fetchHero(): Promise<HeroContent> {
  const { data } = await supabase
    .from('home_content')
    .select('content')
    .eq('section', 'hero')
    .single()
  if (!data) return {}
  return data.content as HeroContent
}

const HEADER_H = 80

export function Hero() {
  const { data: hero = {} } = useQuery({
    queryKey: ['home-hero'],
    queryFn: fetchHero,
  })
  const { bannerH } = useUiStore()

  const offsetTop = HEADER_H + bannerH

  // always render spacer so fixed header+banner don't overlap the content below
  if (!hero.image_url) return <div style={{ height: offsetTop }} />

  const hasText = !!(hero.title || hero.description)

  return (
    <section className="relative w-full overflow-hidden" style={{ marginTop: offsetTop }}>
      <img
        src={hero.image_url}
        alt={hero.title ?? ''}
        className="w-full block object-cover"
        style={{ maxHeight: 600 }}
      />

      {hasText && (
        <div className="absolute inset-0 flex items-end">
          <div className="w-full bg-gradient-to-t from-black/70 to-transparent px-8 pb-10 pt-20">
            <div className="container-site">
              {hero.title && (
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight text-balance">
                  {hero.title}
                  {hero.title_highlight && (
                    <> <span className="text-primary-500">{hero.title_highlight}</span></>
                  )}
                </h1>
              )}
              {hero.description && (
                <p className="mt-3 text-white/80 text-sm md:text-base max-w-2xl font-light leading-relaxed">
                  {hero.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
