import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MenuItem } from '@/types/menu'

async function fetchMenuItems(includeInactive: boolean): Promise<MenuItem[]> {
  let query = supabase.from('menu_items').select('*').order('order_index')
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MenuItem[]
}

/**
 * Itens do menu principal. Por padrão só traz os ativos (uso público, ex: Header).
 * Passe includeInactive: true na tela de admin, onde é preciso ver/editar tudo.
 */
export function useMenuItems(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false
  return useQuery({
    queryKey: ['menu-items', includeInactive],
    queryFn: () => fetchMenuItems(includeInactive),
    staleTime: 5 * 60 * 1000,
  })
}
