import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { LoginPage } from './LoginPage'
import { OnboardingPage } from './OnboardingPage'

type ProfileStatus = 'loading' | 'missing' | 'complete'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user,          setUser]          = useState<User | null>(null)
  const [authLoading,   setAuthLoading]   = useState(true)
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading')

  /* ── Check whether this user has a complete profile ── */
  async function checkProfile(u: User) {
    setProfileStatus('loading')
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, role')
      .eq('id', u.id)
      .maybeSingle()

    if (error || !data || !data.first_name || !data.role) {
      setProfileStatus('missing')
    } else {
      setProfileStatus('complete')
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) await checkProfile(u)
      setAuthLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        await checkProfile(u)
      } else {
        setProfileStatus('loading')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /* ── Loading ── */
  if (authLoading || (user && profileStatus === 'loading')) {
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
        onDevSkip={import.meta.env.DEV ? () => setUser({} as User) : undefined}
      />
    )
  }

  /* ── Authenticated but profile incomplete → onboarding ── */
  if (profileStatus === 'missing') {
    return (
      <OnboardingPage
        userId={user.id}
        onComplete={() => setProfileStatus('complete')}
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
