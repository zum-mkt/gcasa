import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types/models'

async function fetchNotifications(userId: string): Promise<Notification[]> {
  // `as any` — tabela nova (012_notifications.sql), Database (types/database.types.ts)
  // não é regenerado automaticamente e ainda não conhece essa tabela (mesmo padrão de
  // cast já usado nas tabelas do tabloide, ver src/pages/portal/Produtos/index.tsx).
  const { data, error } = await (supabase as any)
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return data as Notification[]
}

/** Sino de notificações do TopBar (admin/editor). Hoje só recebe o aviso de
 *  "tabloide enviado pra produção" — a trigger `notify_admins_tabloid_submission`
 *  (`012_notifications.sql`) cria uma linha por admin/editor toda vez que um
 *  associado envia (ou reenvia) o tabloide em `/portal/produtos`. O formato é
 *  genérico o bastante pra outros avisos futuros sem precisar mexer aqui. */
export function useNotifications() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const userId = user?.id
  const queryKey = ['notifications', userId]

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    // Fallback pro caso do realtime abaixo perder alguma mensagem (aba que
    // ficou em segundo plano, reconexão etc.) — não é o caminho principal.
    refetchInterval: 60_000,
  })

  // Realtime: aviso novo aparece no sino sem precisar recarregar a página.
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey })
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id)
      if (unreadIds.length === 0) return
      const { error } = await (supabase as any).from('notifications').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  }
}
