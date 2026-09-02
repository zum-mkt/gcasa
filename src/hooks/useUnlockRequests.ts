import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TabloidSubmission } from '@/types/models'

export type UnlockRequest = TabloidSubmission & {
  associate?: { id: string; name: string } | null
  edition?: { id: string; name: string } | null
}

async function fetchUnlockRequests(): Promise<UnlockRequest[]> {
  const { data, error } = await supabase
    .from('tabloid_submissions')
    .select('*, associate:associates(id, name), edition:tabloid_editions(id, name)')
    .not('unlock_requested_at', 'is', null)
    .order('unlock_requested_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as UnlockRequest[]
}

export function useUnlockRequests(enabled = true) {
  const qc = useQueryClient()
  const queryKey = ['tabloid-unlock-requests']

  const { data: requests = [], isLoading } = useQuery({
    queryKey,
    queryFn: fetchUnlockRequests,
    enabled,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel('tabloid-unlock-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tabloid_submissions' },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, qc])

  const unlock = useMutation({
    mutationFn: async (submissionId: string) => {
      const { error } = await supabase.rpc('unlock_tabloid_submission', { p_submission_id: submissionId })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      qc.invalidateQueries({ queryKey: ['admin-tabloid-submissions'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return { requests, isLoading, unlock }
}
