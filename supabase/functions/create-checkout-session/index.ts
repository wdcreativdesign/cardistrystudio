import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CREDIT_PACKS: Record<string, number> = {
  'price_1TcYdQRoCyUZdpCt4JmGQytW': 50,   // Starter live
  'price_1TcYdQRoCyUZdpCtIkWOFp3s': 100,  // Pro live
  'price_1TcYdQRoCyUZdpCtV66jq7nu': 500,  // Studio live
}

function decodeJwt(token: string): { sub?: string } | null {
  try {
    const payload = token.split('.')[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const jwt = authHeader.replace('Bearer ', '')
    const payload = decodeJwt(jwt)
    const userId = payload?.sub

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const { priceId } = await req.json()
    const credits = CREDIT_PACKS[priceId]

    if (!credits) {
      return new Response(JSON.stringify({ error: `Invalid price ID: ${priceId}` }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const appUrl = Deno.env.get('APP_URL') ?? 'https://cardistry.studio'

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${appUrl}?credits=ok&amount=${credits}`,
      cancel_url:  appUrl,
      metadata: {
        user_id:        userId,
        credits_to_add: String(credits),
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('create-checkout-session error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
