import { useQuery } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Associate } from '@/types/models'

interface PortalLayoutProps {
  children: React.ReactNode
}

async function fetchOwnAssociate(associateId: string): Promise<Associate | null> {
  const { data } = await supabase.from('associates').select('id, name, logo_url').eq('id', associateId).single()
  return data as Associate | null
}

/* Layout leve pro portal do associado — sem o sidebar largo do admin, já que aqui
   só existe uma página (produtos do tabloide). Reaproveita o mesmo useAuth/signOut
   do painel admin, só troca a casca visual. */
export default function PortalLayout({ children }: PortalLayoutProps) {
  const { profile, associateId, signOut } = useAuth()
  const { data: associate } = useQuery({
    queryKey: ['portal-own-associate', associateId],
    queryFn: () => fetchOwnAssociate(associateId!),
    enabled: !!associateId,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-graphite-900 text-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 flex items-center justify-center flex-shrink-0">
              <span className="text-graphite-900 font-bold text-sm">G</span>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Portal do Associado</p>
              <p className="text-xs text-white/50 leading-tight">{associate?.name ?? profile?.name ?? ''}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
