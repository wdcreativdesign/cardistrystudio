import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { EXPORT_COST } from '@/hooks/useCredits'
import { trackBeginCheckout } from '@/lib/analytics'

const PACKS = [
  {
    id:        'starter',
    name:      'Starter',
    price:     '2,99 €',
    credits:   50,
    priceId:   'price_1TcYdQRoCyUZdpCt4JmGQytW',
    unlimited: false,
  },
  {
    id:        'pro',
    name:      'Pro',
    price:     '4,99 €',
    credits:   100,
    priceId:   'price_1TcYdQRoCyUZdpCtIkWOFp3s',
    popular:   true,
    unlimited: false,
  },
  {
    id:        'studio',
    name:      'Studio',
    price:     '9,99 €',
    credits:   500,
    priceId:   'price_1TcYdQRoCyUZdpCtV66jq7nu',
    unlimited: false,
  },
  {
    id:        'unlimited',
    name:      'Unlimited',
    price:     '24,99 €',
    credits:   10000,
    priceId:   'price_1TcZPpRoCyUZdpCthzlpOu7H',
    unlimited: true,
  },
] as const

interface BuyCreditsModalProps {
  currentBalance: number
  onClose: () => void
}

export function BuyCreditsModal({ currentBalance, onClose }: BuyCreditsModalProps) {
  const [selected, setSelected] = useState<string>('pro')
  const [loading,  setLoading]  = useState(false)

  const selectedPack = PACKS.find((p) => p.id === selected)!

  async function handleBuy() {
    setLoading(true)
    try {
      const priceNum = parseFloat(selectedPack.price.replace(',', '.'))
      trackBeginCheckout(selectedPack.name, Math.round(priceNum * 100))
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId: selectedPack.priceId },
      })
      if (error) throw error
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#111] border border-[#242424] rounded-[24px] w-[320px] mx-4 animate-in fade-in zoom-in-95 duration-150 drop-shadow-[0px_8px_24px_rgba(0,0,0,0.48)]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#242424]">
          <div className="flex flex-col gap-1 px-2 py-2">
            <p className="text-[14px] font-medium text-white">Buy credits</p>
            <p className="text-[12px] text-[#999]">
              Balance · <span className="text-white">{currentBalance}</span> credit{currentBalance !== 1 ? 's' : ''}
              {currentBalance < EXPORT_COST && (
                <span className="text-red-400 ml-1">· {EXPORT_COST} needed</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#242424] text-white/55 hover:text-white/80 transition-all active:scale-95 flex-shrink-0"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Packs */}
        <div className="p-4 flex flex-col gap-2">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelected(pack.id)}
              className={cn(
                'w-full flex items-center gap-2 p-[8px] rounded-[8px] border-2 transition-all text-left active:scale-[0.99]',
                selected === pack.id ? 'border-[#9ae600]' : 'border-[#242424] hover:border-white/20',
              )}
            >
              <div className="w-8 h-8 rounded-full bg-[#242424] flex items-center justify-center flex-shrink-0">
                <Icon
                  name={pack.unlimited ? 'all_inclusive' : 'bolt'}
                  size={16}
                  className={selected === pack.id ? 'text-[#9ae600]' : 'text-white/40'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-white">{pack.name}</span>
                  {'popular' in pack && pack.popular && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#9ae600]/15 text-[#9ae600]">
                      Popular
                    </span>
                  )}
                  {pack.unlimited && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/40">
                      Best value
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#999]">
                  {pack.unlimited ? 'Unlimited exports' : `${pack.credits} credits`}
                </p>
              </div>
              <span className="text-[14px] font-medium text-white flex-shrink-0">{pack.price}</span>
            </button>
          ))}
        </div>

        {/* Footer / CTA */}
        <div className="p-4 pt-0 flex flex-col gap-3">
          <button
            onClick={handleBuy}
            disabled={loading}
            className={cn(
              'w-full h-[41px] rounded-full text-[16px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2',
              loading ? 'bg-[#9ae600]/50 text-[#0d0d0d]/50 cursor-not-allowed' : 'bg-[#9ae600] hover:bg-[#aaff00] text-[#0d0d0d]',
            )}
          >
            {loading && <Icon name="progress_activity" size={18} className="animate-spin" />}
            {loading ? 'Redirecting…' : `Buy — ${selectedPack.price}`}
          </button>
          <p className="text-[12px] text-[#999] text-center">
            Secured by Stripe · 1 export = {EXPORT_COST} credits
          </p>
        </div>

      </div>
    </div>
  )
}
