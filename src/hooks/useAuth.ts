import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import type { Profile } from '@/types/models'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as Profile
}

export function useAuth() {
  const { user, session, profile, isLoading, isInitialized, setUser, setSession, setProfile, setLoading, setInitialized, reset } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          // O `persist` do authStore grava { session, profile } no localStorage
          // do NAVEGADOR, não por usuário — se esse aparelho já teve sessão de
          // outra pessoa (ex.: admin testando), o profile antigo fica em cache
          // até o fetch abaixo terminar. Limpa na hora se o id não bate, senão
          // por uma fração de segundo `profile` fica com o papel de outra
          // pessoa (e telas que decidem algo nesse instante, como o redirect
          // do login, podem escolher o destino errado).
          if (useAuthStore.getState().profile?.id !== session.user.id) setProfile(null)
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        } else {
          reset()
        }
      } catch {
        reset()
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    // Only run full init once — subsequent mounts just attach the listener
    if (!useAuthStore.getState().isInitialized) {
      init()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      try {
        if (session?.user) {
          setSession(session)
          setUser(session.user)
          if (useAuthStore.getState().profile?.id !== session.user.id) setProfile(null)
          const p = await fetchProfile(session.user.id)
          if (mounted) setProfile(p)
        } else {
          reset()
        }
      } catch {
        reset()
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    reset()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })
    if (error) throw error
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  // Trava final: nunca expõe um `profile` que não seja do `user` atual. Cobre
  // a janela entre o `user` novo já estar setado e o fetch do profile novo
  // ainda não ter voltado (ver comentário no useEffect acima) — sem isso,
  // qualquer leitor de `profile`/`isAdmin`/`isEditor`/`isAssociate` correria o
  // risco de ver o papel de outra pessoa por uma fração de segundo.
  const safeProfile = profile && user && profile.id === user.id ? profile : null

  const isAdmin = safeProfile?.role === 'admin'
  const isEditor = safeProfile?.role === 'editor' || isAdmin
  const isAssociate = safeProfile?.role === 'associate'
  const associateId = safeProfile?.associate_id ?? null
  const isAuthenticated = !!session && !!user

  return {
    user,
    session,
    profile: safeProfile,
    isLoading,
    isInitialized,
    isAuthenticated,
    isAdmin,
    isEditor,
    isAssociate,
    associateId,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }
}
