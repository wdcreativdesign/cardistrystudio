import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { supabase } from '@/lib/supabase'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-[#111] border border-[#242424] rounded-[24px] drop-shadow-[0px_8px_12px_rgba(0,0,0,0.32)] w-[360px] mx-4 p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[16px] font-medium text-white">
              {reason === 'export' ? 'Sign in to export' : 'Sign in'}
            </p>
            <p className="text-[14px] font-medium text-[#999]">
              {reason === 'export'
                ? 'Create a free account to export your card'
                : 'Create a free account to get started'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white hover:text-white/60 transition-colors flex-shrink-0">
            <Icon name="close" size={20} />
          </button>
        </div>

        {sent ? (
          /* ── Magic link sent ── */
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-[#242424] flex items-center justify-center">
              <Icon name="mail" size={20} className="text-white/60" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-white mb-1">Check your inbox</p>
              <p className="text-[12px] text-[#999] leading-relaxed">
                Magic link sent to <span className="text-white">{email}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail('') }}
              className="text-[12px] font-medium text-[#999] hover:text-white transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="flex flex-col gap-4">
            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading !== null}
              className="w-full h-[41px] flex items-center justify-center gap-2 border border-[#242424] rounded-full text-[16px] font-medium text-white hover:bg-white/[0.04] transition-all disabled:opacity-50 active:scale-[0.99]"
            >
              {loading === 'google'
                ? <Icon name="progress_activity" size={16} className="animate-spin" />
                : <GoogleIcon />
              }
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[#242424]" />
              <span className="text-[16px] font-medium text-[#999]">or</span>
              <div className="flex-1 h-px bg-[#242424]" />
            </div>

            {/* Email + magic link */}
            <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-[16px] font-medium px-6 py-4 rounded-[8px] border border-[#242424] bg-transparent focus:outline-none focus:border-white/25 transition-all placeholder:text-[#999] text-white"
                required
              />
              <button
                type="submit"
                disabled={loading !== null || !email}
                className="w-full h-[41px] bg-[#9ae600] hover:bg-[#aaff00] text-[#111] text-[16px] font-medium rounded-full transition-all disabled:opacity-40 active:scale-[0.99]"
              >
                {loading === 'magic' ? 'Sending…' : 'Send magic link'}
              </button>
            </form>

            {error && (
              <p className="text-[12px] text-red-500/80 text-center">{error}</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
