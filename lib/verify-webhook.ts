/**
 * Verifies that an incoming webhook request was sent by ChargeBee.
 *
 * ChargeBee signs all webhook deliveries with HTTP Basic Auth:
 *   Authorization: Basic base64(CHARGEBEE_WEBHOOK_USER:CHARGEBEE_WEBHOOK_PASSWORD)
 *
 * Rejecting requests without a valid header is the first line of defence
 * against anyone POSTing fake payloads to our public endpoint and spamming Brevo.
 * (Same class of vulnerability Gaetan mentioned needing to fix in their Cloud Functions.)
 */
export function verifyWebhookAuth(authHeader: string | null): boolean {
  const user = process.env.CHARGEBEE_WEBHOOK_USER
  const password = process.env.CHARGEBEE_WEBHOOK_PASSWORD

  // Skip verification in local dev if credentials are not configured
  if (!user || !password) {
    console.warn('[webhook] CHARGEBEE_WEBHOOK_USER/PASSWORD not set — skipping auth check')
    return true
  }

  if (!authHeader?.startsWith('Basic ')) {
    console.error('[webhook] Missing or invalid Authorization header')
    return false
  }

  const received = Buffer.from(authHeader.slice(6), 'base64').toString()
  const receivedUser = received.split(':')[0]
  const expected = Buffer.from(`${user}:${password}`).toString('base64')
  const match = authHeader === `Basic ${expected}`

  if (!match) {
    console.error(`[webhook] Auth mismatch — received username: "${receivedUser}", expected: "${user}"`)
  }

  return match
}
