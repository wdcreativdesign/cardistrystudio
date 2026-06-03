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
    icon:      'science',
    unlimited: false,
  },
  {
    id:        'pro',
    name:      'Pro',
    price:     '4,99 €',
    credits:   100,
    priceId:   'price_1TcYdQRoCyUZdpCtIkWOFp3s',
    icon:      'neurology',
    tag:       'Popular',
    unlimited: false,
  },
  {
    id:        'studio',
    name:      'Studio',
    price:     '9,99 €',
    credits:   500,
    priceId:   'price_1TcYdQRoCyUZdpCtV66jq7nu',
    icon:      'panorama_photosphere',
    unlimited: false,
  },
  {
    id:        'unlimited',
    name:      'Unlimited',
    tag:       'Best value',
    price:     '24,99 €',
    credits:   10000,
    priceId:   'price_1TcZPpRoCyUZdpCthzlpOu7H',
    icon:      'all_inclusive',
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-[#111] border border-[#242424] rounded-[24px] w-[380px] mx-4 p-6 flex flex-col gap-6 drop-shadow-[0px_8px_12px_rgba(0,0,0,0.32)] animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[16px] font-medium text-white">Buy tokens</p>
            <p className="text-[14px] font-medium text-[#999]">
              Balance · <span className="text-white">{currentBalance >= 1000 ? 'Unlimited' : currentBalance}</span> tokens
              {currentBalance < EXPORT_COST && (
                <span className="text-red-400 ml-1">· {EXPORT_COST} needed</span>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white hover:text-white/60 transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Packs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setSelected(pack.id)}
                className={cn(
                  'w-full flex items-center gap-6 px-6 rounded-[16px] text-left transition-all active:scale-[0.99] h-[72px]',
                  selected === pack.id ? 'border-2 border-[#9ae600]' : 'border border-[#242424] hover:border-white/20',
                )}
              >
                <Icon
                  name={pack.icon}
                  size={20}
                  className="text-[#9ae600] flex-shrink-0"
                />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <p className="text-[14px] font-medium text-white">{pack.name}</p>
                  {!pack.unlimited && (
                    <p className="text-[12px] font-medium text-[#999]">{pack.credits} tokens</p>
                  )}
                </div>
                {'tag' in pack && pack.tag && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#9ae600]/15 text-[#9ae600] flex-shrink-0 self-center">
                    {pack.tag}
                  </span>
                )}
                <p className="text-[14px] font-medium text-white flex-shrink-0">{pack.price}</p>
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleBuy}
            disabled={loading}
            className={cn(
              'w-full h-[41px] rounded-full text-[16px] font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2',
              loading ? 'bg-[#9ae600]/50 text-[#111]/50 cursor-not-allowed' : 'bg-[#9ae600] hover:bg-[#aaff00] text-[#111]',
            )}
          >
            {loading && <Icon name="progress_activity" size={18} className="animate-spin" />}
            {loading ? 'Redirecting…' : `Buy – ${selectedPack.price}`}
          </button>

          <p className="text-[12px] font-medium text-[#999] text-center">
            Secured by Stripe. Cost {EXPORT_COST} tokens by exports
          </p>
        </div>

      </div>
    </div>
  )
}
