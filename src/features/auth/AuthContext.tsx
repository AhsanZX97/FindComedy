import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../../services/supabase'
import type { Profile } from '../../types/auth'
import { getProfile } from '../../services/profilesService'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
}

export interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isConfigured: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
  })

  useEffect(() => {
    if (!supabase) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null, isLoading: false }))
      if (session?.user) {
        getProfile(session.user.id).then((profile) => setState((s) => ({ ...s, profile })))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) {
        getProfile(session.user.id).then((profile) => setState((s) => ({ ...s, profile })))
      } else {
        setState((s) => ({ ...s, profile: null }))
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw new Error(error.message)
  }

  async function verifyOtp(email: string, token: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) throw new Error(error.message)
  }

  async function signInWithGoogle(): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + (import.meta.env.BASE_URL ?? '/') },
    })
    if (error) throw new Error(error.message)
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  return (
    <AuthContext.Provider
      value={{ ...state, signInWithEmail, verifyOtp, signInWithGoogle, signOut, isConfigured: isSupabaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
