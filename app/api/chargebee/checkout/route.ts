import { NextResponse } from 'next/server'
import { createHostedCheckout } from '@/lib/chargebee'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { itemPriceId, email } = body as { itemPriceId?: string; email?: string }

  if (!itemPriceId) {
    return NextResponse.json({ error: 'itemPriceId is required' }, { status: 400 })
  }

  const base = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const successUrl = `${base}/checkout/success${email ? `?email=${encodeURIComponent(email)}` : ''}`
  const cancelUrl = `${base}/pricing`

  try {
    const { url } = await createHostedCheckout(itemPriceId, successUrl, cancelUrl, email)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[chargebee] checkout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 502 },
    )
  }
}
