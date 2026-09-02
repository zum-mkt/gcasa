import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const MIN_DURATION_MS = 1500

async function fetchLogo() {
  const { data } = await supabase.from('settings').select('value').eq('key', 'site').single()
  const site = (data?.value ?? {}) as { company_name?: string; logo_url?: string }
  return { companyName: site.company_name ?? 'Grupo GCasa', logoUrl: site.logo_url ?? null }
}

/**
 * Overlay de abertura, uma única vez por carregamento completo da página (não reaparece
 * em navegação de rota dentro da SPA, já que fica montado só uma vez no App root).
 * Fica por cima do app, que já está montando por baixo — evita atrasar/bloquear queries.
 */
export function LoadingScreen() {
  const [show, setShow] = useState(true)
  const { data } = useQuery({ queryKey: ['header-site-settings-logo'], queryFn: fetchLogo, staleTime: 5 * 60 * 1000 })

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), MIN_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-graphite-900 pointer-events-none"
          aria-hidden="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            {data?.logoUrl ? (
              <img src={data.logoUrl} alt={data.companyName} className="h-12 w-auto object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 bg-primary-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{(data?.companyName ?? 'G')[0]}</span>
                </div>
                <span className="text-xl heading-editorial text-white tracking-wide">
                  {data?.companyName ?? 'Grupo GCasa'}
                </span>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
