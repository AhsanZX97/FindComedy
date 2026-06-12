import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../../services/supabase'
import type { Profile } from '../../types/auth'
import { getProfile, getIsAdmin } from '../../services/profilesService'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAdmin: boolean
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
    isAdmin: false,
    isLoading: true,
  })

  useEffect(() => {
    if (!supabase) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) {
        const [profile, isAdmin] = await Promise.all([
          getProfile(session.user.id),
          getIsAdmin(session.user.id),
        ])
        setState((s) => ({ ...s, profile, isAdmin, isLoading: false }))
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) {
        void getProfile(session.user.id).then((profile) => setState((s) => ({ ...s, profile })))
        void getIsAdmin(session.user.id).then((isAdmin) => setState((s) => ({ ...s, isAdmin })))
      } else {
        setState((s) => ({ ...s, profile: null, isAdmin: false }))
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
