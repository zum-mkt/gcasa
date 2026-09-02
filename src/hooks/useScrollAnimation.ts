import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import type { Variants } from 'framer-motion'

/* Viewport padrão usado por toda animação de scroll-reveal do site — dispara um pouco
   antes do elemento entrar de fato, e só uma vez (não re-anima ao rolar pra cima/baixo). */
export const revealViewport = { once: true, margin: '-80px' } as const

/* Título entrando da esquerda — usado no cabeçalho de cada seção (tag + h2). */
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

/* Texto/bloco genérico entrando de baixo — parágrafos, descrições, listas simples. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

/* Imagem/foto — fade + leve zoom-out de 0.95 para 1, dá sensação de "assentar" na tela. */
export const imageReveal: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

/* Container de grid de cards — orquestra o stagger entre os filhos (staggerItem). */
export function staggerContainer(staggerDelay = 0.1): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: staggerDelay } },
  }
}

/* Cada card sobe com fade — usar como variants no filho, sem initial/whileInView próprios
   (herdam do container pai via propagação do framer-motion). */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

/* Classe utilitária pronta pro hover "levanta com sombra dourada" pedido para cards de
   loja/parceiro — usar via className, não precisa de framer-motion. */
export const hoverLiftGold =
  'hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(250,177,54,0.3)] transition-all duration-300'

/**
 * Conta de 0 até `value` via GSAP quando o elemento entra na viewport.
 * Mesmo mecanismo usado no Hero, extraído aqui pra ser reaproveitado (ex: Stats).
 */
export function useCountUp(value: string, suffix?: string, duration = 1.2) {
  const ref = useRef<HTMLSpanElement>(null)
  const numeric = parseInt(value.replace(/\D/g, ''), 10)
  const isNumeric = !isNaN(numeric)
  const [display, setDisplay] = useState(isNumeric ? '0' : value)

  useEffect(() => {
    if (!isNumeric || !ref.current) { setDisplay(value); return }
    const el = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const counter = { val: 0 }
        gsap.to(counter, {
          val: numeric,
          duration,
          ease: 'power2.out',
          onUpdate: () => setDisplay(String(Math.round(counter.val))),
        })
        observer.disconnect()
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [numeric, isNumeric, value, duration])

  return { ref, display: `${display}${suffix ?? ''}` }
}

/** Estado "rolou além do threshold" — usado pelo header pra intensificar blur/sombra. */
export function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [threshold])
  return scrolled
}
