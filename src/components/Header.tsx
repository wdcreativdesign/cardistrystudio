import { useState, useRef, useEffect, useCallback } from 'react'
import { Icon } from '@/components/ui/icon'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type MenuView     = 'main' | 'feedback'
type FeedbackStep = 'form' | 'sending' | 'done' | 'error'

interface HeaderProps {
  onRestart:      () => void
  onReset?:       () => void
  onRoadmap?:     () => void
  onLogoClick?:   () => void
  logoColor?:     '#1a1a1a' | '#ffffff'
  credits?:       number | null
  onBuyCredits?:  () => void
  onSignIn?:      () => void
  userEmail?:     string | null
}

export function Header({
  onRestart,
  onReset,
  onRoadmap,
  onLogoClick,
  credits,
  onBuyCredits,
  onSignIn,
  userEmail,
}: HeaderProps) {
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [view,        setView]        = useState<MenuView>('main')
  const [fbStep,      setFbStep]      = useState<FeedbackStep>('form')
  const [rating,      setRating]      = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message,     setMessage]     = useState('')

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
    setTimeout(() => { setView('main'); setFbStep('form'); setRating(0); setHoverRating(0); setMessage('') }, 200)
  }

  async function handleSignOut() { closeMenu(); await supabase.auth.signOut() }

  const handleFeedbackSubmit = useCallback(async () => {
    if (rating === 0) return
    setFbStep('sending')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id ?? null, user_email: user?.email ?? null,
        rating, message: message.trim() || null,
      })
      if (error) throw error
      setFbStep('done')
      setTimeout(() => closeMenu(), 2500)
    } catch {
      setFbStep('error')
      setTimeout(() => setFbStep('form'), 2500)
    }
  }, [rating, message])

  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : null
  const hasAvatar    = userEmail != null

  return (
    <header className="h-[72px] flex items-center justify-between pl-6 pr-4 bg-[#111] border-b border-[#242424] flex-shrink-0 z-20">

      {/* ── Logo ── */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-3 transition-opacity hover:opacity-70 active:scale-[0.97] cursor-pointer bg-transparent border-none p-0"
      >
        <img src="/favicon.svg" alt="CardistryStudio" className="w-8 h-8 flex-shrink-0" />
        <span className="text-[18px] text-white leading-none">
          <span className="font-semibold">Cardistry</span>
          <span className="font-normal">Studio</span>
        </span>
      </button>

      {/* ── Reset + Avatar ── */}
      <div className="flex items-center gap-2">
        {onReset && (
          <button
            onClick={onReset}
            title="Reset to default"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#252525] border border-white/[0.1] text-white/55 hover:text-white/80 hover:bg-[#2e2e2e] transition-all active:scale-95"
          >
            <Icon name="replay" size={18} />
          </button>
        )}
        {onRoadmap && (
          <button
            onClick={onRoadmap}
            title="What's coming"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#252525] border border-white/[0.1] text-white/55 hover:text-white/80 hover:bg-[#2e2e2e] transition-all active:scale-95"
          >
            <Icon name="info" size={18} />
          </button>
        )}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => hasAvatar ? setMenuOpen((o) => !o) : onSignIn?.()}
          title={hasAvatar ? 'Profile' : 'Sign in'}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all active:scale-[0.95]',
            'bg-[#252525] hover:bg-[#2e2e2e] border border-white/[0.1]',
            menuOpen && 'bg-[#2e2e2e]',
            hasAvatar ? 'text-white/70' : 'text-white/55',
          )}
        >
          {hasAvatar ? avatarLetter : <Icon name="account_circle" size={20} filled />}
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute top-12 right-0 z-50 w-[280px] bg-[#111] rounded-[24px] drop-shadow-[0px_8px_12px_rgba(0,0,0,0.32)] border border-[#242424] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">

            {/* ── Not logged in ── */}
            {!hasAvatar && (
              <div className="p-4 flex flex-col gap-2.5">
                <p className="text-[14px] font-medium text-white">Sign in</p>
                <p className="text-[12px] text-[#999] leading-relaxed">Sign in to export your cards and save your work.</p>
                <button
                  onClick={() => { closeMenu(); onSignIn?.() }}
                  className="w-full bg-[#9AE600] hover:bg-[#aaff00] text-[#0d0d0d] rounded-full text-[14px] font-medium h-[41px] transition-all active:scale-[0.98]"
                >
                  Sign in / Sign up
                </button>
              </div>
            )}

            {/* ── Logged in: main ── */}
            {hasAvatar && view === 'main' && (
              <>
                {/* User info */}
                <div className="p-4 border-b border-[#242424]">
                  <div className="flex flex-col gap-1 px-2 py-2">
                    <p className="text-[14px] font-medium text-white leading-tight truncate">
                      {userEmail?.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? avatarLetter}
                    </p>
                    <p className="text-[12px] text-[#999] truncate">{userEmail}</p>
                  </div>
                </div>

                {/* Subscription / Credits */}
                <div className="p-4 border-b border-[#242424] flex flex-col gap-2">
                  <div className="flex items-center">
                    <span className="text-[12px] font-medium text-[#999]">Subscription</span>
                  </div>
                  {credits != null && (
                    <div className="flex items-center gap-1 p-2 rounded-full">
                      <Icon name="bolt" size={16} className="text-white flex-shrink-0" />
                      <span className="flex-1 text-[14px] font-medium text-white">Credits</span>
                      <span className="text-[14px] font-medium text-[#9ae600]">
                        {credits >= 1000 ? '∞' : credits}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => { onBuyCredits?.(); closeMenu() }}
                    className="w-full h-[41px] rounded-full text-[16px] font-medium bg-[#242424] hover:bg-[#2e2e2e] text-white transition-all active:scale-[0.98]"
                  >
                    Buy credits
                  </button>
                </div>

                {/* Actions */}
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center">
                    <span className="text-[12px] font-medium text-[#999]">Actions</span>
                  </div>
                  <div className="flex flex-col text-white">
                    <button
                      onClick={() => setView('feedback')}
                      className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <Icon name="chat_bubble" size={16} className="flex-shrink-0" />
                      <span className="flex-1 text-[14px] font-medium">Give feedback</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <Icon name="logout" size={16} className="flex-shrink-0" />
                      <span className="flex-1 text-[14px] font-medium">Log out</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Feedback ── */}
            {hasAvatar && view === 'feedback' && (
              <>
                <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/[0.06]">
                  <button onClick={() => setView('main')} className="text-white/30 hover:text-white/55 transition-colors active:scale-95">
                    <Icon name="chevron_left" size={20} />
                  </button>
                  <p className="text-[13px] font-semibold text-white/80">Give feedback</p>
                </div>

                {fbStep === 'done' && (
                  <div className="flex flex-col items-center gap-3 py-8 px-6">
                    <div className="w-10 h-10 rounded-full bg-[#9AE600]/10 flex items-center justify-center">
                      <Icon name="check_circle" size={22} filled className="text-[#9AE600]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-white/80 mb-1">Thanks!</p>
                      <p className="text-[11.5px] text-white/40 leading-relaxed">Your feedback helps make<br />CardistryStudio better.</p>
                    </div>
                  </div>
                )}

                {fbStep === 'error' && (
                  <div className="flex flex-col items-center gap-2 py-8 px-6">
                    <p className="text-[13px] text-red-400 font-medium">Something went wrong.</p>
                    <p className="text-[11.5px] text-white/40">Please try again.</p>
                  </div>
                )}

                {(fbStep === 'form' || fbStep === 'sending') && (
                  <div className="p-4 space-y-3.5">
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-white/35 font-medium">How would you rate your experience?</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} className="p-0.5 transition-transform hover:scale-110 active:scale-95">
                            <Icon name="star" size={24} filled={s <= (hoverRating || rating)} className={cn('transition-colors duration-100', s <= (hoverRating || rating) ? 'text-amber-400' : 'text-white/15')} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Anything to share? (optional)" rows={3}
                      className="w-full resize-none text-[12px] leading-relaxed px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.025] focus:outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all placeholder:text-white/20 text-white/65"
                    />
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={rating === 0 || fbStep === 'sending'}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 text-[12px] font-medium py-2.5 rounded-xl transition-all active:scale-[0.98]',
                        rating === 0 || fbStep === 'sending'
                          ? 'bg-white/6 text-white/25 cursor-not-allowed'
                          : 'bg-[#9AE600] hover:bg-[#aaff00] text-[#0d0d0d]',
                      )}
                    >
                      {fbStep === 'sending' && <Icon name="progress_activity" size={16} className="animate-spin" />}
                      {fbStep === 'sending' ? 'Sending…' : 'Send feedback'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </header>
  )
}
