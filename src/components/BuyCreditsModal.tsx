import { useState } from 'react'
import { X, Zap, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { EXPORT_COST } from '@/hooks/useCredits'

const PACKS = [
  {
    id:         'starter',
    name:       'Starter',
    price:      '2,99 €',
    credits:    50,
    priceId:    'price_1TcWPgRweuBuHe9C7xCFXP8W',
    perExport:  '0,30 €',
    popular:    false,
  },
  {
    id:         'pro',
    name:       'Pro',
    price:      '4,99 €',
    credits:    100,
    priceId:    'price_1TcWQCRweuBuHe9CQmFbyQqJ',
    perExport:  '0,25 €',
    popular:    true,
  },
  {
    id:         'studio',
    name:       'Studio',
    price:      '9,99 €',
    credits:    500,
    priceId:    'price_1TcWQQRweuBuHe9C93Arf6ne',
    perExport:  '0,10 €',
    popular:    false,
  },
] as const

interface BuyCreditsModalProps {
  currentBalance: number
  onClose: () => void
}

export function BuyCreditsModal({ currentBalance, onClose }: BuyCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleBuy(priceId: string, packId: string) {
    setLoading(packId)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      })
      if (error) throw error
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-black/[0.07] w-[400px] mx-4 animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-black/85">Acheter des crédits</h2>
            <p className="text-[12px] text-black/40 mt-1">
              Solde actuel ·{' '}
              <span className="font-semibold text-black/60">{currentBalance} crédit{currentBalance !== 1 ? 's' : ''}</span>
              {currentBalance < EXPORT_COST && (
                <span className="text-red-400 ml-1.5">· il en faut {EXPORT_COST} pour exporter</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-black/25 hover:text-black/50 transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Packs */}
        <div className="px-6 pb-6 space-y-2">
          {PACKS.map((pack) => {
            const isLoading = loading === pack.id
            return (
              <button
                key={pack.id}
                onClick={() => handleBuy(pack.priceId, pack.id)}
                disabled={!!loading}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left',
                  'hover:bg-black/[0.025] active:scale-[0.99]',
                  pack.popular
                    ? 'border-black/20 bg-black/[0.02]'
                    : 'border-black/[0.08] bg-transparent',
                  !!loading && !isLoading && 'opacity-50',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    {isLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      : <Zap className="w-3.5 h-3.5 text-amber-400" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-black/80">{pack.name}</span>
                      <span className="text-[11px] text-black/45 font-medium">{pack.credits} crédits</span>
                      {pack.popular && (
                        <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-black/[0.06] text-black/40">
                          Populaire
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-black/30 mt-0.5">{pack.perExport} par export</p>
                  </div>
                </div>
                <span className="text-[14px] font-semibold text-black/75 flex-shrink-0">{pack.price}</span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-0">
          <p className="text-[10px] text-black/25 text-center">
            Paiement sécurisé par Stripe · 1 export = {EXPORT_COST} crédits
          </p>
        </div>
      </div>
    </div>
  )
}
