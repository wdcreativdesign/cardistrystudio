import { useState, useCallback } from 'react'
import { type User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Icon } from '@/components/ui/icon'

interface Props {
  currentUser: User | null
  onClose: () => void
}

export function FeedbackPromptModal({ currentUser, onClose }: Props) {
  const [rating,  setRating]  = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [step,    setStep]    = useState<'form' | 'sending' | 'done'>('form')

  const handleSubmit = useCallback(async () => {
    if (step !== 'form') return
    setStep('sending')
    await supabase.from('feedback').insert({
      message:    message.trim() || null,
      user_id:    currentUser?.id    ?? null,
      user_email: currentUser?.email ?? null,
      rating:     rating,
    })
    setStep('done')
    setTimeout(onClose, 2000)
  }, [message, rating, step, currentUser, onClose])

  const stars = [1, 2, 3, 4, 5]
  const activeRating = hovered ?? rating

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div
        className="w-full max-w-[400px] mx-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[24px] p-6 shadow-2xl"
        style={{ animation: 'feedbackSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {step === 'done' ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-[32px]">🎉</p>
            <p className="text-[16px] font-semibold text-white">Thanks for the feedback!</p>
            <p className="text-[13px] text-[#555]">It helps make CardistryStudio better.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-[16px] font-semibold text-white">How was your experience?</p>
                <p className="text-[12px] text-[#555] mt-0.5">Your feedback helps improve CardistryStudio.</p>
              </div>
              <button
                onClick={onClose}
                className="text-[#555] hover:text-white transition-colors flex-shrink-0"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {stars.map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setRating(s)}
                  className="transition-transform active:scale-90"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={s <= (activeRating ?? 0) ? '#9ae600' : '#2a2a2a'}
                      stroke={s <= (activeRating ?? 0) ? '#9ae600' : '#3a3a3a'}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      style={{ transition: 'fill 0.15s ease, stroke 0.15s ease' }}
                    />
                  </svg>
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.metaKey && handleSubmit()}
              placeholder="Tell us what you think… (optional)"
              rows={3}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-[12px] px-3 py-2.5 text-[13px] text-white placeholder-[#444] outline-none focus:border-[#444] transition-colors resize-none"
            />

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={onClose}
                className="flex-1 h-[41px] rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-[13px] font-medium text-white/50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!rating || step === 'sending'}
                className="flex-1 h-[41px] rounded-full bg-[#9ae600] hover:bg-[#aaff00] disabled:opacity-40 text-[13px] font-semibold text-[#111] transition-all active:scale-95"
              >
                {step === 'sending' ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
