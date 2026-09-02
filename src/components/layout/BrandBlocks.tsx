import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BrandBlocksProps {
  className?: string
  variant?: 'corner' | 'stack'
}

/* Cada quadrado flutua/gira de forma independente e contínua — sutil, mas sempre viva */
const floatA = {
  animate: { y: [0, -8, 0], x: [0, 4, 0], rotate: [0, 4, 0] },
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
}
const floatB = {
  animate: { y: [0, 7, 0], x: [0, -5, 0], rotate: [0, -6, 0] },
  transition: { duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
}

/**
 * Acento decorativo inspirado no símbolo GCasa: quadrados/blocos empilhados
 * em laranja e dourado, com flutuação contínua e independente. Puramente
 * ornamental — sem estado, sem dados.
 */
export function BrandBlocks({ className, variant = 'corner' }: BrandBlocksProps) {
  if (variant === 'stack') {
    return (
      <div className={cn('relative w-14 h-14 pointer-events-none select-none', className)} aria-hidden="true">
        <motion.span animate={floatA.animate} transition={floatA.transition} className="absolute bottom-0 left-0 w-8 h-8 bg-primary-500" />
        <motion.span animate={floatB.animate} transition={floatB.transition} className="absolute top-0 right-0 w-6 h-6 bg-[#575756]" />
      </div>
    )
  }

  return (
    <div className={cn('relative w-16 h-16 pointer-events-none select-none', className)} aria-hidden="true">
      <motion.span animate={floatA.animate} transition={floatA.transition} className="absolute bottom-0 left-0 w-9 h-9 bg-primary-500" />
      <motion.span animate={floatB.animate} transition={floatB.transition} className="absolute bottom-6 left-9 w-6 h-6 bg-[#575756]" />
    </div>
  )
}
