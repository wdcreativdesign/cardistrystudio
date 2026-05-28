import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { LoginPage } from './LoginPage'
import { OnboardingPage } from './OnboardingPage'

async function fetchProfileComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, role')
    .eq('id', userId)
    .maybeSingle()
  return !error && !!data && !!data.first_name && !!data.role
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user,            setUser]            = useState<User | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      const u = session?.user ?? null
      setUser(u)

      if (u) {
        const complete = await fetchProfileComplete(u.id)
        if (!mounted) return
        setProfileComplete(complete)
      }

      setLoading(false)
    }

    init()

    // Only react to real sign-in / sign-out events — skip INITIAL_SESSION
    // (already handled by getSession above) and TOKEN_REFRESHED.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfileComplete(false)
        return
      }
      if (event === 'SIGNED_IN') {
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          const complete = await fetchProfileComplete(u.id)
          if (!mounted) return
          setProfileComplete(complete)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f0f5]">
        <div className="text-black/30 text-[13px]">Loading…</div>
      </div>
    )
  }

  /* ── Not authenticated ── */
  if (!user) {
    return (
      <LoginPage
        onDevSkip={import.meta.env.DEV ? () => {
          setUser({ id: 'dev-user' } as User)
          setProfileComplete(true)
          setLoading(false)
        } : undefined}
      />
    )
  }

  /* ── Authenticated but profile incomplete → onboarding ── */
  if (!profileComplete) {
    return (
      <OnboardingPage
        userId={user.id}
        onComplete={() => setProfileComplete(true)}
      />
    )
  }

  /* ── Fully onboarded → app ── */
  return <>{children}</>
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return user
}
