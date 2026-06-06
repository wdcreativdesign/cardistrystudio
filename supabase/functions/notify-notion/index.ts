import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const NOTION_TOKEN = Deno.env.get('NOTION_TOKEN')!
const NOTION_DB_ID = '3775b17c-b427-81e9-8adf-e2a8da9a9022'

serve(async (req) => {
  try {
    const payload = await req.json()
    // Supabase webhook sends { type, table, record, ... }
    const record = payload.record ?? payload

    const message    = record.message    ?? record.content ?? '—'
    const email      = record.email      ?? record.user_email ?? '—'
    const created_at = record.created_at ?? new Date().toISOString()
    const rating     = record.rating     ?? null

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          Message:      { title:   [{ text: { content: message } }] },
          Email:        { email:   email },
          'Created at': { date:    { start: created_at } },
          ...(rating !== null && { Rating: { number: rating } }),
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Notion error:', err)
      return new Response(JSON.stringify({ error: err }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
})
