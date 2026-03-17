import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookAuth } from '@/lib/verify-webhook'
import { isProcessed, markProcessed } from '@/lib/idempotency'
import {
  handleActivated,
  handlePaymentFailed,
  handleCancelled,
  handleReactivated,
  type SubscriptionInfo,
} from '@/lib/brevo'

export async function POST(req: NextRequest) {
  // TODO: re-enable auth once credentials are aligned with ChargeBee
  // if (!verifyWebhookAuth(req.headers.get('authorization'))) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  const payload = await req.json()

  // Idempotency check
  const chargebeeEventId: string | undefined = payload.id
  if (chargebeeEventId && isProcessed(chargebeeEventId)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  const eventType = payload.event_type ?? 'unknown'
  const email = payload.content?.customer?.email ?? 'N/A'
  console.log(`[webhook] event=${eventType} email=${email}`)

  // Extract subscription info from payload
  const rawSub = payload.content?.subscription
  const sub: SubscriptionInfo | undefined = rawSub
    ? {
        plan_id: rawSub.plan_id ?? rawSub.plan_item_price_id,
        status: rawSub.status,
        current_term_end: rawSub.current_term_end,
      }
    : undefined

  // Dispatch to lifecycle handler based on event_type
  let result
  switch (eventType) {
    case 'subscription_created':
    case 'subscription_activated':
    case 'subscription_renewed':
    case 'payment_succeeded':
      result = await handleActivated(email, sub)
      break
    case 'payment_failed':
      result = await handlePaymentFailed(email, sub)
      break
    case 'subscription_cancelled':
      result = await handleCancelled(email, sub)
      break
    case 'subscription_reactivated':
      result = await handleReactivated(email, sub)
      break
    default:
      result = await handleActivated(email, sub)
  }

  // Mark as processed AFTER success (allows retry on failure)
  if (chargebeeEventId && result.status === 'synced') {
    markProcessed(chargebeeEventId)
  }

  console.log(`[webhook] brevo sync result: ${result.status}, contact_id: ${result.brevo_contact_id}`)
  return NextResponse.json({ received: true, status: result.status })
}
