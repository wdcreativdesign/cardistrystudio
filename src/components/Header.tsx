import { useState, useRef, useEffect, useCallback } from 'react'
import { RotateCcw, Zap, Infinity, MessageSquare, LogOut, Star, CheckCircle, Loader2, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

/* ─── Types ──────────────────────────────────────────────────────── */
type MenuView    = 'main' | 'feedback'
type FeedbackStep = 'form' | 'sending' | 'done' | 'error'

interface HeaderProps {
  onRestart:     () => void
  onLogoClick?:  () => void
  logoColor?:    '#1a1a1a' | '#ffffff'
  credits?:      number | null
  onBuyCredits?: () => void
  onSignIn?:     () => void
  userEmail?:    string | null
}

/* ─── Header ─────────────────────────────────────────────────────── */
export function Header({
  onRestart,
  onLogoClick,
  logoColor = '#1a1a1a',
  credits,
  onBuyCredits,
  onSignIn,
  userEmail,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [view,     setView]     = useState<MenuView>('main')
  const [fbStep,   setFbStep]   = useState<FeedbackStep>('form')
  const [rating,      setRating]      = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message,     setMessage]     = useState('')

  const menuRef = useRef<HTMLDivElement>(null)

  /* Close on outside click */
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
    /* Reset state after close animation */
    setTimeout(() => {
      setView('main')
      setFbStep('form')
      setRating(0)
      setHoverRating(0)
      setMessage('')
    }, 200)
  }

  async function handleSignOut() {
    closeMenu()
    await supabase.auth.signOut()
  }

  const handleFeedbackSubmit = useCallback(async () => {
    if (rating === 0) return
    setFbStep('sending')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('feedback').insert({
        user_id:    user?.id    ?? null,
        user_email: user?.email ?? null,
        rating,
        message:    message.trim() || null,
      })
      if (error) throw error
      setFbStep('done')
      setTimeout(() => closeMenu(), 2500)
    } catch {
      setFbStep('error')
      setTimeout(() => setFbStep('form'), 2500)
    }
  }, [rating, message])

  const dark = logoColor !== '#ffffff'

  /* Button base class — adapts to light/dark scene bg */
  const btnClass = dark
    ? 'border-black/[0.08] bg-white/70 hover:bg-white text-black/35 hover:text-black/60 backdrop-blur-sm'
    : 'border-white/20 bg-white/15 hover:bg-white/25 text-white/60 hover:text-white/90 backdrop-blur-sm'

  /* Avatar letter */
  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : '?'

  const hasAvatar = userEmail != null

  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none">

      {/* ── Logo ── */}
      <div className="flex items-center pointer-events-auto">
        <button
          onClick={onLogoClick}
          className="text-[17px] tracking-[-0.02em] transition-all duration-200 hover:opacity-60 active:scale-[0.97] cursor-pointer bg-transparent border-none p-0"
          style={{ color: logoColor }}
        >
          <span className="font-semibold">Cardistry</span>
          <span className="font-normal">
            Studio<sup className="text-[10px] align-super">™</sup>
          </span>
          <span
            className="ml-2 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md align-middle"
            style={{
              color:           logoColor === '#ffffff' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)',
              backgroundColor: logoColor === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)',
            }}
          >
            Beta
          </span>
        </button>
      </div>

      {/* ── Actions ── */}
      <div className="pointer-events-auto flex items-center gap-2">

        {/* Credits badge — shown only when logged in */}
        {hasAvatar && credits != null && (
          <button
            onClick={onBuyCredits}
            title="Buy credits"
            className={cn(
              'flex items-center gap-1.5 px-3 h-9 rounded-xl border shadow-sm transition-all active:scale-[0.97] text-[12px] font-medium',
              btnClass,
            )}
          >
            {credits >= 1000
              ? <Infinity className="w-3.5 h-3.5 flex-shrink-0" />
              : <><Zap className="w-3 h-3 flex-shrink-0" />{credits}</>
            }
          </button>
        )}

        {/* Restart */}
        <button
          onClick={onRestart}
          className={cn(
            'flex items-center gap-2 border text-[13px] font-medium px-4 py-2 h-9 rounded-xl shadow-sm transition-all active:scale-[0.97]',
            btnClass,
            dark ? 'text-black/55 hover:text-black/80' : '',
          )}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart
        </button>

        {/* ── Sign in (non connecté) ── */}
        {!hasAvatar && (
          <button
            onClick={onSignIn}
            className={cn(
              'flex items-center gap-2 border text-[13px] font-medium px-4 py-2 h-9 rounded-xl shadow-sm transition-all active:scale-[0.97]',
              btnClass,
            )}
          >
            Sign in
          </button>
        )}

        {/* ── Avatar / Profile dropdown ── */}
        {hasAvatar && (
          <div ref={menuRef} className="relative">

            {/* Avatar button */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              title="Profile"
              className={cn(
                'w-9 h-9 rounded-xl border shadow-sm transition-all active:scale-[0.97]',
                'flex items-center justify-center text-[13px] font-semibold',
                dark
                  ? 'border-black/[0.08] bg-white/80 hover:bg-white text-black/55 backdrop-blur-sm'
                  : 'border-white/20 bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-sm',
                menuOpen && (dark ? 'bg-white text-black/70' : 'bg-white/30 text-white'),
              )}
            >
              {avatarLetter}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute top-11 right-0 z-50 w-[252px] bg-white rounded-2xl shadow-2xl border border-black/[0.07] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">

                {/* ── Main view ── */}
                {view === 'main' && (
                  <>
                    {/* User info */}
                    <div className="px-4 pt-4 pb-3.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold text-white mb-3 select-none"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                      >
                        {avatarLetter}
                      </div>
                      <p className="text-[13px] font-semibold text-black/80 truncate leading-tight">{userEmail}</p>
                    </div>

                    <div className="h-px bg-black/[0.06] mx-3" />

                    {/* Credits */}
                    {credits != null && (
                      <div className="px-3 py-3">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-1.5">
                            {credits >= 1000
                              ? <Infinity className="w-3.5 h-3.5 text-black/35" />
                              : <Zap className="w-3 h-3 text-black/35" />
                            }
                            <span className="text-[12px] text-black/55 font-medium">
                              {credits >= 1000 ? 'Unlimited' : `${credits} credits`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => { onBuyCredits?.(); closeMenu() }}
                          className="w-full text-[11.5px] font-medium py-1.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.07] text-black/45 hover:text-black/65 transition-all"
                        >
                          Buy credits
                        </button>
                      </div>
                    )}

                    <div className="h-px bg-black/[0.06] mx-3" />

                    {/* Menu items */}
                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => setView('feedback')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-black/55 hover:text-black/80 hover:bg-black/[0.04] transition-all text-left"
                      >
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                        Give feedback
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] text-black/55 hover:text-red-500 hover:bg-red-50 transition-all text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
                        Log out
                      </button>
                    </div>

                    <div className="px-4 py-2.5">
                      <p className="text-[10px] text-black/20 text-center">CardistryStudio Beta</p>
                    </div>
                  </>
                )}

                {/* ── Feedback view ── */}
                {view === 'feedback' && (
                  <>
                    {/* Header */}
                    <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-black/[0.06]">
                      <button
                        onClick={() => setView('main')}
                        className="text-black/30 hover:text-black/55 transition-colors active:scale-95"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <p className="text-[13px] font-semibold text-black/80">Give feedback</p>
                    </div>

                    {/* Done */}
                    {fbStep === 'done' && (
                      <div className="flex flex-col items-center gap-3 py-8 px-6">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-[13px] font-semibold text-black/80 mb-1">Thanks!</p>
                          <p className="text-[11.5px] text-black/40 leading-relaxed">
                            Your feedback helps make<br />CardistryStudio better.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {fbStep === 'error' && (
                      <div className="flex flex-col items-center gap-2 py-8 px-6">
                        <p className="text-[13px] text-red-500 font-medium">Something went wrong.</p>
                        <p className="text-[11.5px] text-black/40">Please try again.</p>
                      </div>
                    )}

                    {/* Form */}
                    {(fbStep === 'form' || fbStep === 'sending') && (
                      <div className="p-4 space-y-3.5">
                        {/* Stars */}
                        <div className="space-y-1.5">
                          <p className="text-[11px] text-black/35 font-medium">How would you rate your experience?</p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                onClick={() => setRating(s)}
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                              >
                                <Star
                                  className={cn(
                                    'w-6 h-6 transition-colors duration-100',
                                    s <= (hoverRating || rating)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-black/12 fill-black/5',
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Textarea */}
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Anything to share? (optional)"
                          rows={3}
                          className="w-full resize-none text-[12px] leading-relaxed px-3 py-2.5 rounded-xl border border-black/10 bg-black/[0.025] focus:outline-none focus:border-black/25 focus:bg-white transition-all placeholder:text-black/20 text-black/65"
                        />

                        {/* Submit */}
                        <button
                          onClick={handleFeedbackSubmit}
                          disabled={rating === 0 || fbStep === 'sending'}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 text-[12px] font-medium py-2.5 rounded-xl transition-all active:scale-[0.98]',
                            rating === 0 || fbStep === 'sending'
                              ? 'bg-black/6 text-black/25 cursor-not-allowed'
                              : 'bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white',
                          )}
                        >
                          {fbStep === 'sending' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {fbStep === 'sending' ? 'Sending…' : 'Send feedback'}
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>
            )}
          </div>
        )}

      </div>
    </header>
  )
}
