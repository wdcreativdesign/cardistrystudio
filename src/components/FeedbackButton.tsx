import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, Star, X, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Step = 'idle' | 'open' | 'sending' | 'done' | 'error'

interface FeedbackButtonProps {
  logoColor?: '#1a1a1a' | '#ffffff'
}

export function FeedbackButton({ logoColor = '#1a1a1a' }: FeedbackButtonProps) {
  const [step,        setStep]        = useState<Step>('idle')
  const [rating,      setRating]      = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message,     setMessage]     = useState('')

  const wrapperRef = useRef<HTMLDivElement>(null)

  /* ── Close on outside click ── */
  useEffect(() => {
    if (step === 'idle' || step === 'done') return
    const onDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setStep('idle')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [step])

  const handleOpen = useCallback(() => {
    setStep((s) => (s === 'open' ? 'idle' : 'open'))
  }, [])

  const handleClose = useCallback(() => {
    setStep('idle')
    setRating(0)
    setHoverRating(0)
    setMessage('')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return
    setStep('sending')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('feedback').insert({
        user_id:    user?.id    ?? null,
        user_email: user?.email ?? null,
        rating,
        message:    message.trim() || null,
      })
      if (error) throw error
      setStep('done')
      setTimeout(() => {
        setStep('idle')
        setRating(0)
        setHoverRating(0)
        setMessage('')
      }, 3000)
    } catch {
      setStep('error')
      setTimeout(() => setStep('open'), 2500)
    }
  }, [rating, message])

  const isOpen = step !== 'idle'

  /* ── Button style adapts to logo color (dark/light bg) ── */
  const btnClass = logoColor === '#ffffff'
    ? 'border-white/20 bg-white/15 hover:bg-white/25 text-white/60 hover:text-white/90 backdrop-blur-sm'
    : 'border-black/12 bg-white/70 hover:bg-white text-black/35 hover:text-black/60 backdrop-blur-sm'

  return (
    <div ref={wrapperRef} className="relative">
      {/* ── Trigger button ── */}
      <button
        onClick={handleOpen}
        title="Share feedback"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-xl border shadow-sm transition-all active:scale-[0.97]',
          btnClass,
          isOpen && logoColor !== '#ffffff' && 'bg-white text-black/60',
          isOpen && logoColor === '#ffffff' && 'bg-white/25 text-white/90',
        )}
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>

      {/* ── Popover ── */}
      {isOpen && (
        <div className="absolute top-11 right-0 z-50 w-[288px] bg-white rounded-2xl shadow-2xl border border-black/[0.07] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">

          {/* ── Success state ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-9 px-6">
              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-black/80 mb-1">Thanks!</p>
                <p className="text-[12px] text-black/40 leading-relaxed">
                  Your feedback helps make CardistryStudio better.
                </p>
              </div>
            </div>
          )}

          {/* ── Error state ── */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-3 py-9 px-6">
              <p className="text-[13px] text-red-500 font-medium">Something went wrong.</p>
              <p className="text-[12px] text-black/40">Please try again.</p>
            </div>
          )}

          {/* ── Form ── */}
          {(step === 'open' || step === 'sending') && (
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-black/80">Share feedback</p>
                <button
                  onClick={handleClose}
                  className="text-black/25 hover:text-black/50 transition-colors active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Star rating */}
              <div className="space-y-1.5">
                <p className="text-[11px] text-black/35 font-medium">How would you rate your experience?</p>
                <div className="flex gap-1">
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
                placeholder="Anything else you'd like to share? (optional)"
                rows={3}
                className="w-full resize-none text-[12px] leading-relaxed px-3 py-2.5 rounded-xl border border-black/10 bg-black/[0.025] focus:outline-none focus:border-black/25 focus:bg-white transition-all placeholder:text-black/20 text-black/65"
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || step === 'sending'}
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'text-[12px] font-medium py-2.5 rounded-xl transition-all active:scale-[0.98]',
                  rating === 0 || step === 'sending'
                    ? 'bg-black/6 text-black/25 cursor-not-allowed'
                    : 'bg-[#1a1a1a] hover:bg-[#2d2d2d] text-white',
                )}
              >
                {step === 'sending' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {step === 'sending' ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
