import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
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

interface LoginModalProps {
  onClose: () => void
  reason?: 'export'
}

export function LoginModal({ onClose, reason }: LoginModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/[0.07] w-[360px] mx-4 animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-white/85">
              {reason === 'export' ? 'Sign in to export' : 'Sign in'}
            </h2>
            <p className="text-[12px] text-white/35 mt-0.5">
              {reason === 'export'
                ? 'Create a free account to download your card'
                : 'No password needed'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/25 hover:text-white/60 transition-colors mt-0.5"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Free credits banner */}
        <div className="mx-6 mb-4 flex items-center gap-2.5 bg-[#9AE600]/10 border border-[#9AE600]/20 rounded-xl px-3.5 py-2.5">
          <span className="text-[15px]">🎁</span>
          <p className="text-[11.5px] text-[#9AE600]/80 leading-snug">
            <span className="font-semibold text-[#9AE600]">15 free credits</span> on your first sign-up — no card required.
          </p>
        </div>

        {/* Form */}
        <div className="px-6 pb-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-[14px] font-semibold text-white/80 mb-1">Check your inbox</h3>
              <p className="text-[12px] text-white/45 leading-relaxed">
                Magic link sent to<br />
                <span className="font-medium text-white/65">{email}</span>
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-4 text-[11px] text-white/30 hover:text-white/55 transition-colors underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2.5 border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] rounded-xl py-2.5 text-[13px] font-medium text-white/65 transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                {loading === 'google'
                  ? <span className="animate-spin text-[10px] text-white/30">◌</span>
                  : <GoogleIcon />
                }
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-0.5">
                <div className="flex-1 h-px bg-white/[0.07]" />
                <span className="text-[11px] text-white/20">or</span>
                <div className="flex-1 h-px bg-white/[0.07]" />
              </div>

              {/* Magic link */}
              <form onSubmit={handleMagicLink} className="space-y-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-[13px] px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.02] focus:outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all placeholder:text-white/25"
                  required
                />
                <button
                  type="submit"
                  disabled={loading !== null || !email}
                  className="w-full bg-[#9AE600] hover:bg-[#aaff00] text-[#0d0d0d] text-[13px] font-medium py-2.5 rounded-full transition-all disabled:opacity-40 active:scale-[0.99]"
                >
                  {loading === 'magic' ? 'Sending…' : 'Send magic link'}
                </button>
              </form>

              {error && (
                <p className="text-[11px] text-red-500/80 text-center leading-relaxed">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
