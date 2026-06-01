import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const EXPORT_COST = 5

export function useCredits(userId: string | undefined) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    // Initial fetch
    supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setBalance(data?.balance ?? 0)
        setLoading(false)
      })

    // Real-time subscription
    const channel = supabase
      .channel(`credits:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'user_credits',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBalance((payload.new as { balance: number }).balance)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return { balance, loading }
}
