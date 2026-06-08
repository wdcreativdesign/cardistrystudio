import { useState } from 'react'
import { type User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { trackMagicLinkSent, trackBuyWideScreenClick } from '@/lib/analytics'

const DEMO_VIDEO_ID: string | null = 'rPIU2nXtAcw'

export function SmallScreenBlock({ currentUser }: { currentUser: User | null }) {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    const trimmed = email.trim()
    if (!trimmed || loading) return
    setLoading(true)
    await supabase.auth.signInWithOtp({ email: trimmed, options: { shouldCreateUser: true } })
    trackMagicLinkSent()
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#111] flex flex-col items-center justify-center px-8">

      {/* Center content */}
      <div className="flex flex-col items-center gap-10 w-full max-w-[550px]">

        {/* Logo + texte — contraints à 350px */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[350px]">
          <img src="/favicon.svg" alt="CardistryStudio" className="w-[62px] h-[62px]" />
          <div className="flex flex-col gap-1 text-center w-full">
            <p className="text-[12px] font-medium text-[#999]">Hello,</p>
            <p className="text-[14px] font-medium text-white">This tool is not available on small devices.</p>
          </div>
        </div>

        {/* Vidéo de démo — visible uniquement côté non connecté */}
        {!currentUser && DEMO_VIDEO_ID && (
          <div className="w-full rounded-[22px] overflow-hidden aspect-video bg-[#1d1d1d] border border-[#242424]">
            <iframe
              src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0&modestbranding=1`}
              title="CardistryStudio demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

        {/* Placeholder visible tant qu'aucune vidéo n'est définie */}
        {!currentUser && !DEMO_VIDEO_ID && (
          <div className="w-full rounded-[22px] aspect-video bg-[#1d1d1d] border border-[#242424] flex items-center justify-center">
            <p className="text-[12px] font-medium text-[#555]">Demo video coming soon</p>
          </div>
        )}

        {currentUser ? (
          /* ── Connecté ── */
          <a
            href="https://www.amazon.com/s?k=wide+screen+monitor"
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackBuyWideScreenClick}
            className="h-[41px] px-6 bg-[#242424] hover:bg-[#2e2e2e] rounded-full flex items-center justify-center text-[16px] font-medium text-white transition-all active:scale-95"
          >
            Buy a wide screen
          </a>
        ) : (
          /* ── Pas connecté ── */
          <div className="flex flex-col gap-4 w-full">
            {sent ? (
              <p className="text-[14px] font-medium text-center text-[#9ae600]">
                Magic link sent! Check your inbox.
              </p>
            ) : (
              <>
                <p className="text-[14px] font-medium text-center text-white">
                  Type your email and receive something magic.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="your@email.com"
                  className="w-full h-[53px] px-6 bg-transparent border border-[#242424] rounded-[8px] text-[16px] font-medium text-white placeholder-[#999] outline-none focus:border-[#444] transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="w-full h-[41px] px-6 bg-[#9ae600] hover:bg-[#aaff00] disabled:opacity-50 rounded-full flex items-center justify-center text-[16px] font-medium text-[#111] transition-all active:scale-95"
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-[14px] font-medium text-center">
        <span className="text-[#999]">Crafted by </span>
        <a
          href="https://www.linkedin.com/in/wylliam-duparc/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline hover:text-[#9ae600] transition-colors"
        >
          Wylliam Duparc
        </a>
      </p>

    </div>
  )
}
