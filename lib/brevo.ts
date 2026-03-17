/**
 * Brevo CRM sync — list-based lifecycle management.
 *
 * Instead of toggling emailBlacklisted, contacts are moved between lists:
 *   LEADS → ACTIVE → PAST_DUE / CHURNED
 *
 * Env vars (fallback 0 = skip that list):
 *   BREVO_LIST_LEADS, BREVO_LIST_ACTIVE, BREVO_LIST_PAST_DUE, BREVO_LIST_CHURNED
 */

export interface BrevoResult {
  brevo_contact_id: string | null
  status: 'synced' | 'error'
}

export interface SubscriptionInfo {
  plan_id?: string
  status?: string
  current_term_end?: number
}

const BREVO_BASE = 'https://api.brevo.com/v3'

function listId(envKey: string): number {
  return Number(process.env[envKey] ?? '0')
}

const LIST_LEADS = () => listId('BREVO_LIST_LEADS')
const LIST_ACTIVE = () => listId('BREVO_LIST_ACTIVE')
const LIST_PAST_DUE = () => listId('BREVO_LIST_PAST_DUE')
const LIST_CHURNED = () => listId('BREVO_LIST_CHURNED')

function getHeaders() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey || apiKey === 'your-brevo-api-key-here') return null
  return {
    'api-key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function fetchContactId(email: string): Promise<string | null> {
  const headers = getHeaders()
  if (!headers) return null
  const res = await fetch(`${BREVO_BASE}/contacts/${encodeURIComponent(email)}`, {
    headers: { 'api-key': headers['api-key'], Accept: 'application/json' },
  })
  if (res.ok) {
    const data = await res.json()
    return data.id ? String(data.id) : null
  }
  return null
}

export async function upsertContact(
  email: string,
  listIds: number[],
  attributes: Record<string, string | number>,
): Promise<BrevoResult> {
  const headers = getHeaders()
  if (!headers) {
    console.warn('[brevo] BREVO_API_KEY not configured — skipping sync')
    return { brevo_contact_id: 'skipped', status: 'synced' }
  }

  const validListIds = listIds.filter((id) => id > 0)

  const body: Record<string, unknown> = {
    email,
    attributes,
    updateEnabled: true,
  }
  if (validListIds.length > 0) body.listIds = validListIds

  const res = await fetch(`${BREVO_BASE}/contacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (res.ok) {
    const data = res.status === 201 ? await res.json() : {}
    const id = data.id ? String(data.id) : await fetchContactId(email)
    return { brevo_contact_id: id, status: 'synced' }
  }

  console.error('[brevo] upsert failed:', res.status, await res.text())
  return { brevo_contact_id: null, status: 'error' }
}

export async function removeFromList(email: string, listId: number): Promise<void> {
  if (listId <= 0) return
  const headers = getHeaders()
  if (!headers) return

  await fetch(`${BREVO_BASE}/contacts/lists/${listId}/contacts/remove`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ emails: [email] }),
  })
}

// ---------------------------------------------------------------------------
// Transactional email
// ---------------------------------------------------------------------------

export async function sendTransactionalEmail(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<boolean> {
  const headers = getHeaders()
  if (!headers) {
    console.warn('[brevo] BREVO_API_KEY not configured — skipping email')
    return false
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME ?? 'CBDemo'

  if (!senderEmail) {
    console.warn('[brevo] BREVO_SENDER_EMAIL not configured — skipping email')
    return false
  }

  const res = await fetch(`${BREVO_BASE}/smtp/email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  })

  if (res.ok) {
    console.log(`[brevo] Transactional email sent to ${to}: "${subject}"`)
    return true
  }

  console.error('[brevo] sendTransactionalEmail failed:', res.status, await res.text())
  return false
}

export async function sendWelcomeEmail(email: string, planId: string): Promise<boolean> {
  const subject = 'Welcome to your new subscription!'
  const htmlContent = `<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1>Welcome aboard!</h1>
  <p>Thanks for subscribing to the <strong>${planId}</strong> plan.</p>
  <p>Here's how to get started:</p>
  <ol>
    <li>Log in to your dashboard</li>
    <li>Explore the features included in your plan</li>
    <li>Check out our documentation for tips and best practices</li>
  </ol>
  <p>If you have any questions, just reply to this email — we're happy to help.</p>
  <p>— The CBDemo Team</p>
</body>
</html>`

  return sendTransactionalEmail(email, subject, htmlContent)
}

// ---------------------------------------------------------------------------
// Lifecycle handlers
// ---------------------------------------------------------------------------

export async function handleActivated(email: string, sub?: SubscriptionInfo): Promise<BrevoResult> {
  // Remove from LEADS, PAST_DUE, CHURNED in parallel
  await Promise.all([
    removeFromList(email, LIST_LEADS()),
    removeFromList(email, LIST_PAST_DUE()),
    removeFromList(email, LIST_CHURNED()),
  ])

  const result = await upsertContact(email, [LIST_ACTIVE()], {
    CHARGEBEE_STATUS: 'active',
    CHARGEBEE_PLAN: sub?.plan_id ?? '',
    CHARGEBEE_EVENT: 'subscription_activated',
  })

  if (result.status === 'synced') {
    await sendWelcomeEmail(email, sub?.plan_id ?? 'default')
  }

  return result
}

export async function handlePaymentFailed(email: string, sub?: SubscriptionInfo): Promise<BrevoResult> {
  await removeFromList(email, LIST_ACTIVE())

  return upsertContact(email, [LIST_PAST_DUE()], {
    CHARGEBEE_STATUS: 'past_due',
    CHARGEBEE_PLAN: sub?.plan_id ?? '',
    CHARGEBEE_EVENT: 'payment_failed',
  })
}

export async function handleCancelled(email: string, sub?: SubscriptionInfo): Promise<BrevoResult> {
  await Promise.all([
    removeFromList(email, LIST_ACTIVE()),
    removeFromList(email, LIST_PAST_DUE()),
  ])

  return upsertContact(email, [LIST_CHURNED()], {
    CHARGEBEE_STATUS: 'churned',
    CHARGEBEE_PLAN: sub?.plan_id ?? '',
    CHARGEBEE_EVENT: 'subscription_cancelled',
  })
}

export async function handleReactivated(email: string, sub?: SubscriptionInfo): Promise<BrevoResult> {
  await removeFromList(email, LIST_CHURNED())
  return handleActivated(email, sub)
}

