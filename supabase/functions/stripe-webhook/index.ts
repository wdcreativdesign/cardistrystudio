import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body      = await req.text()

  const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY')!
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const supabaseUrl   = Deno.env.get('SUPABASE_URL')!

  // Get service role key — try both old and new secret names
  const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS')
  let serviceRoleKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!serviceRoleKey && secretKeysRaw) {
    try {
      const parsed = JSON.parse(secretKeysRaw)
      serviceRoleKey = parsed.service_role ?? parsed.default ?? Object.values(parsed)[0] as string
    } catch { /* ignore */ }
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Webhook signature error:', msg)
    return new Response(`Webhook error: ${msg}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    const { user_id, credits_to_add } = session.metadata ?? {}
    if (!user_id || !credits_to_add) {
      console.error('Missing metadata in session:', session.id)
      return new Response('Missing metadata', { status: 400 })
    }

    // Call add_credits via Supabase REST API with service role key
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/add_credits`
    const res = await fetch(rpcUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        p_user_id: user_id,
        p_amount:  parseInt(credits_to_add),
        p_reason:  'purchase',
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Failed to add credits:', errText)
      return new Response(`DB error: ${errText}`, { status: 500 })
    }

    console.log(`✅ Added ${credits_to_add} credits to user ${user_id}`)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
