import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { gsap } from 'gsap'
import { Particles, ParticlesProvider, type ParticlesPluginRegistrar } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { ISourceOptions } from '@tsparticles/engine'
import { supabase } from '@/lib/supabase'
import { BrandBlocks } from '@/components/layout/BrandBlocks'
import { prefetchRoute } from '@/lib/routePrefetch'
import type { HeroContent } from '@/types/models'

/* Rede de conexão da marca — blocos quadrados linkados por linhas, reage ao mouse.
   Reforça a mensagem de "rede empresarial" de forma mais presente e interativa. */
const initParticlesEngine: ParticlesPluginRegistrar = async (engine) => {
  await loadSlim(engine)
}

const particlesOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    number: { value: 22, density: { enable: true, width: 1200, height: 800 } },
    color: { value: ['#F9B233', '#575756'] },
    shape: { type: 'square' },
    opacity: { value: { min: 0.12, max: 0.35 } },
    size: { value: { min: 2, max: 4 } },
    rotate: { value: { min: 0, max: 45 }, animation: { enable: true, speed: 2 } },
    links: {
      enable: true,
      distance: 120,
      color: '#F9B233',
      opacity: 0.14,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1,
      direction: 'none',
      random: true,
      straight: false,
      outModes: { default: 'out' },
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'grab' },
      onClick: { enable: true, mode: 'push' },
      resize: { enable: true },
    },
    modes: {
      grab: { distance: 180, links: { opacity: 0.7 } },
      push: { quantity: 3 },
    },
  },
  detectRetina: true,
}

async function fetchHero(): Promise<HeroContent> {
  const { data } = await supabase
    .from('home_content')
    .select('content')
    .eq('section', 'hero')
    .single()
  if (!data) return defaultHero
  return data.content as HeroContent
}

const defaultHero: HeroContent = {
  tag: 'REDE EMPRESARIAL DO SETOR DE CONSTRUÇÃO',
  title: 'Construindo empresas mais fortes através da',
  title_highlight: 'colaboração.',
  description: 'O Grupo GCasa reúne empresários do setor de materiais de construção para gerar desenvolvimento, compartilhar conhecimento e fortalecer resultados.',
  cta_primary_label: 'Quero me Associar',
  cta_primary_href: '/quero-me-associar',
  cta_secondary_label: 'Conheça o Grupo',
  cta_secondary_href: '/quem-somos',
}

/* Reaproveita as fotos que o admin já cadastra em Quem Somos/Benefícios pra compor o
   slideshow do Hero — sem novo campo. QueryKey própria (diferente da desses componentes)
   porque o formato retornado aqui é só a URL, não o conteúdo completo da seção. */
async function fetchAboutImage(): Promise<string | null> {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'about').single()
  return (data?.content as { image_url?: string | null } | undefined)?.image_url ?? null
}

async function fetchBenefitsImage(): Promise<string | null> {
  const { data } = await supabase.from('home_content').select('content').eq('section', 'benefits').single()
  return (data?.content as { image_url?: string } | undefined)?.image_url ?? null
}

const SLIDE_INTERVAL = 5000

/* Cascata título(0s) → subtítulo(0.3s) → botões(0.6s) → cards(0.9s, via statPop) */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: i * 0.3, ease: [0.22, 1, 0.36, 1] } }),
}

const imageReveal = {
  hidden: { opacity: 0, scale: 1.06, y: 24 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const blocksRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 70])
  const shapeYSlow = useTransform(scrollYProgress, [0, 1], [0, -50])
  const shapeYFast = useTransform(scrollYProgress, [0, 1], [0, 90])

  const { data: hero, isPending } = useQuery({
    queryKey: ['home-hero'],
    queryFn: fetchHero,
  })
  const { data: aboutImage } = useQuery({ queryKey: ['about-home-image'], queryFn: fetchAboutImage })
  const { data: benefitsImage } = useQuery({ queryKey: ['benefits-home-image'], queryFn: fetchBenefitsImage })

  const slides = [hero?.image_url, aboutImage, benefitsImage].filter(
    (url): url is string => !!url
  )
  const [slideIndex, setSlideIndex] = useState(0)

  /* Slideshow de fundo — crossfade automático a cada 5s entre as fotos já cadastradas no admin */
  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [slides.length])

  /* Timeline GSAP no carregamento: barra "desenha" da esquerda pra direita, blocos "constroem" com bounce */
  useEffect(() => {
    if (isPending) return
    const tl = gsap.timeline()
    if (barRef.current) {
      tl.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.out', transformOrigin: 'left center' })
    }
    if (blocksRef.current) {
      tl.fromTo(
        blocksRef.current,
        { y: -50, opacity: 0, rotate: -8 },
        { y: 0, opacity: 1, rotate: 0, duration: 0.9, ease: 'bounce.out' },
        0.5
      )
    }
    return () => { tl.kill() }
  }, [isPending])

  if (isPending) {
    return <section id="hero" className="min-h-[85vh] bg-graphite-900 scroll-mt-20" />
  }

  const content = hero ?? defaultHero
  const isVideo = content.media_type === 'video' && !!content.video_url

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[85vh] flex items-center overflow-hidden scroll-mt-20 bg-graphite-900"
    >
      <div ref={barRef} className="absolute top-0 left-0 right-0 h-[2px] bg-primary-500 z-20" />

      {/* Fundo — vídeo em loop se configurado no admin, senão foto em tela cheia (com slideshow
          crossfade entre as fotos cadastradas) */}
      {isVideo ? (
        <motion.div style={{ y: imageY }} className="absolute inset-0">
          <video
            src={content.video_url!}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        </motion.div>
      ) : (
        slides.length > 0 && (
          <motion.div style={{ y: imageY }} className="absolute inset-0">
            <AnimatePresence mode="sync">
              <motion.img
                key={slides[slideIndex]}
                src={slides[slideIndex]}
                alt="Grupo GCasa"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </motion.div>
        )
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0D2228] via-[#0D2228]/82 to-[#0D2228]/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D2228]/80 via-transparent to-[#0D2228]/25" />

      {!isVideo && slides.length > 1 && (
        <div className="absolute top-6 right-6 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`} />
          ))}
        </div>
      )}

      {/* Rede de blocos interativa — reage ao mouse (grab) e ao clique (push) */}
      <div className="absolute inset-0 z-[1]">
        <ParticlesProvider init={initParticlesEngine}>
          <Particles id="hero-particles" options={particlesOptions} className="absolute inset-0" />
        </ParticlesProvider>
      </div>

      {/* Background dinâmico — blocos da marca flutuando, com parallax no scroll */}
      <motion.span
        aria-hidden="true"
        style={{ y: shapeYSlow }}
        animate={{ y: [0, -16, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden lg:block absolute top-24 right-[10%] w-20 h-20 bg-primary-500/20 z-[1] pointer-events-none"
      />
      <motion.span
        aria-hidden="true"
        style={{ y: shapeYFast }}
        animate={{ y: [0, 14, 0], x: [0, -8, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="hidden lg:block absolute bottom-24 right-[20%] w-14 h-14 bg-golden-500/25 z-[1] pointer-events-none"
      />
      <motion.span
        aria-hidden="true"
        animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="hidden lg:block absolute top-[45%] right-[35%] w-6 h-6 bg-primary-500/30 z-[1] pointer-events-none"
      />

      {/* Texto sobreposto, alinhado à esquerda */}
      <div className="container-site relative z-10 py-24">
        <div className="max-w-2xl">
          {content.tag && (
            <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="section-label-light mb-4">
              {content.tag}
            </motion.p>
          )}

          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-4xl md:text-5xl lg:text-[3.5rem] heading-editorial text-white leading-[1.18] text-balance"
          >
            {content.title}
            {content.title_highlight && (
              <> <span className="text-primary-500">{content.title_highlight}</span></>
            )}
          </motion.h1>

          {content.description && (
            <motion.p custom={1} variants={fadeUp} initial="hidden" animate="show" className="mt-6 text-lg text-white/85 leading-relaxed max-w-xl">
              {content.description}
            </motion.p>
          )}

          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="mt-8 flex flex-wrap gap-4">
            <Link
              to={content.cta_primary_href ?? '/quero-me-associar'}
              onMouseEnter={() => prefetchRoute(content.cta_primary_href ?? '/quero-me-associar')}
              onFocus={() => prefetchRoute(content.cta_primary_href ?? '/quero-me-associar')}
              onTouchStart={() => prefetchRoute(content.cta_primary_href ?? '/quero-me-associar')}
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-graphite-900 font-bold px-8 py-4 transition-colors text-base tracking-wide shadow-card"
            >
              {content.cta_primary_label}
              <ArrowRight size={16} />
            </Link>
            <Link
              to={content.cta_secondary_href ?? '/quem-somos'}
              onMouseEnter={() => prefetchRoute(content.cta_secondary_href ?? '/quem-somos')}
              onFocus={() => prefetchRoute(content.cta_secondary_href ?? '/quem-somos')}
              onTouchStart={() => prefetchRoute(content.cta_secondary_href ?? '/quem-somos')}
              className="inline-flex items-center gap-2 text-white hover:text-white/80 font-bold px-8 py-4 border-2 border-white/50 hover:border-white transition-colors text-base"
            >
              {content.cta_secondary_label}
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Blocos da marca — entram com bounce, depois flutuam devagar */}
      <div ref={blocksRef} className="absolute bottom-28 left-8 z-10 hidden md:block opacity-0">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }}
        >
          <BrandBlocks variant="stack" />
        </motion.div>
      </div>

      {/* Seta de scroll — indica que há mais conteúdo abaixo */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden sm:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/70"
        aria-hidden="true"
      >
        <ChevronDown size={22} />
      </motion.div>
    </section>
  )
}
