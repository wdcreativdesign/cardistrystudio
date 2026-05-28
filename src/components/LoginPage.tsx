import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function LoginPage({ onDevSkip }: { onDevSkip?: () => void }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState<'magic' | 'google' | null>(null)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading('magic')
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      if (error.message.toLowerCase().includes('rate')) setSent(true)
      else setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(null)
  }

  async function handleGoogle() {
    setLoading('google')
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setLoading(null) }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">

      {/* ── Left — login ────────────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-[#f5f5f7] px-8">
        <div className="w-full max-w-[340px]">

          {/* Logo */}
          <div className="mb-10 text-center">
            <span className="text-[22px] tracking-[-0.02em] text-[#1a1a1a]">
              <span className="font-semibold">Cardistry</span>
              <span className="font-normal">Studio<sup className="text-[11px] align-super">™</sup></span>
            </span>
            <p className="text-[13px] text-black/35 mt-1">3D Card Visualizer</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-black/[0.07] shadow-xl shadow-black/[0.05] p-6">
            {sent ? (
              /* ── Confirmation ── */
              <div className="text-center py-3">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.04] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="text-[15px] font-semibold text-black/85 mb-1.5">Check your inbox</h2>
                <p className="text-[13px] text-black/45 leading-relaxed">
                  We sent a magic link to<br />
                  <span className="font-medium text-black/70">{email}</span>
                </p>
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="mt-4 text-[11px] text-black/30 hover:text-black/55 transition-colors underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-[15px] font-semibold text-black/85 mb-0.5 text-center">Sign in</h2>
                <p className="text-[12px] text-black/35 text-center mb-5">No password needed</p>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={loading !== null}
                  className="w-full flex items-center justify-center gap-2.5 border border-black/10 bg-white hover:bg-black/[0.025] rounded-xl py-2.5 text-[13px] font-medium text-black/65 transition-all disabled:opacity-50 mb-3 active:scale-[0.99]"
                >
                  {loading === 'google'
                    ? <span className="animate-spin text-[10px] text-black/30">◌</span>
                    : <GoogleIcon />
                  }
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px bg-black/[0.07]" />
                  <span className="text-[11px] text-black/20">or</span>
                  <div className="flex-1 h-px bg-black/[0.07]" />
                </div>

                {/* Magic link */}
                <form onSubmit={handleMagicLink} className="space-y-2.5">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] focus:outline-none focus:border-black/25 focus:bg-white transition-all placeholder:text-black/25"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading !== null || !email}
                    className="w-full bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white text-[13px] font-medium py-2.5 rounded-xl transition-all disabled:opacity-40 active:scale-[0.99]"
                  >
                    {loading === 'magic' ? 'Sending…' : 'Send magic link'}
                  </button>
                </form>

                {error && (
                  <p className="text-[11px] text-red-500/80 mt-3 text-center leading-relaxed">{error}</p>
                )}
              </>
            )}
          </div>

          {onDevSkip && (
            <button
              onClick={onDevSkip}
              className="block mx-auto mt-4 text-[10px] text-black/20 hover:text-black/40 transition-colors underline"
            >
              [DEV] Skip auth
            </button>
          )}
        </div>
      </div>

      {/* ── Right — placeholder image ──────────────────────────────── */}
      <div className="w-1/2 relative bg-[#e8e8ed] overflow-hidden">
        {/* Placeholder content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 select-none">
          <div className="w-16 h-16 rounded-2xl bg-black/[0.06] flex items-center justify-center">
            <svg className="w-7 h-7 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5M6.75 6.75h.008v.008H6.75V6.75z" />
            </svg>
          </div>
          <p className="text-[12px] text-black/25 font-medium">Image coming soon</p>
        </div>
      </div>

    </div>
  )
}
