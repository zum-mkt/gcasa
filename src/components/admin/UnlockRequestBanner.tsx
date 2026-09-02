import { AlertTriangle, Unlock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUnlockRequests } from '@/hooks/useUnlockRequests'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { tabloidUnlockError } from '@/lib/tabloidErrors'

/** Faixa permanente no admin enquanto houver pedido de alteração pendente. */
export function UnlockRequestBanner() {
  const navigate = useNavigate()
  const { requests, unlock } = useUnlockRequests()
  if (requests.length === 0) return null

  const first = requests[0]!
  const store = first.associate?.name ?? 'Uma loja'
  const edition = first.edition?.name ?? 'um tabloide'

  const handleUnlock = (id: string) => {
    unlock.mutate(id, {
      onSuccess: () => toast.success('Edição liberada.', 'A loja já pode alterar os produtos e precisa enviar de novo.'),
      onError: (e: Error) => {
        const friendly = tabloidUnlockError(e)
        toast.error(friendly?.title ?? 'Erro ao liberar', friendly?.description ?? e.message)
      },
    })
  }

  return (
    <div className="flex-shrink-0 bg-amber-500 text-graphite-900 px-4 py-2.5 flex items-center gap-3 flex-wrap border-b-2 border-amber-600">
      <AlertTriangle size={18} className="flex-shrink-0" strokeWidth={2.4} />
      <p className="text-sm font-semibold flex-1 min-w-0">
        {requests.length === 1
          ? `${store} pediu pra alterar o tabloide “${edition}” depois do envio. Veja se ainda dá tempo antes da gráfica.`
          : `${requests.length} lojas pediram pra alterar o tabloide depois do envio. A primeira: ${store} — “${edition}”.`}
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="bg-white border-graphite-900/20"
          onClick={() => navigate(`/admin/tabloides?edicao=${first.edition_id}`)}
        >
          Ver tabloide
        </Button>
        <Button
          size="sm"
          variant="dark"
          leftIcon={<Unlock size={14} />}
          loading={unlock.isPending}
          onClick={() => handleUnlock(first.id)}
        >
          Liberar edição
        </Button>
      </div>
    </div>
  )
}
