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

  const isAdmin = profile?.role === 'admin'
  const isEditor = profile?.role === 'editor' || isAdmin
  const isAuthenticated = !!session && !!user

  return {
    user,
    session,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated,
    isAdmin,
    isEditor,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }
}
