/**
 * Thin wrapper around Chargebee API v2 — raw fetch, no SDK.
 *
 * Auth: HTTP Basic with API key as username, empty password.
 * Body: form-urlencoded (Chargebee v2 convention).
 */

const CHARGEBEE_SITE = process.env.CHARGEBEE_SITE ?? ''
const CHARGEBEE_API_KEY = process.env.CHARGEBEE_API_KEY ?? ''

function getBaseUrl() {
  return `https://${CHARGEBEE_SITE}.chargebee.com/api/v2`
}

function getAuthHeader() {
  return `Basic ${Buffer.from(`${CHARGEBEE_API_KEY}:`).toString('base64')}`
}

export async function listItemPrices(): Promise<
  { id: string; name: string; price: number; period: number; period_unit: string; item_id: string }[]
> {
  const res = await fetch(`${getBaseUrl()}/item_prices`, {
    method: 'GET',
    headers: { Authorization: getAuthHeader() },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chargebee list item_prices failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return (data.list ?? []).map((entry: Record<string, unknown>) => {
    const ip = entry.item_price as Record<string, unknown>
    return {
      id: ip.id,
      name: ip.name ?? ip.id,
      price: ip.price ?? 0,
      period: ip.period ?? 1,
      period_unit: ip.period_unit ?? '',
      item_id: ip.item_id ?? '',
    }
  })
}

export async function createHostedCheckout(
  itemPriceId: string,
  successUrl: string,
  cancelUrl: string,
  email?: string,
): Promise<{ url: string }> {
  const params = new URLSearchParams()
  params.append('subscription_items[item_price_id][0]', itemPriceId)
  params.append('redirect_url', successUrl)
  params.append('cancel_url', cancelUrl)
  if (email) {
    params.append('customer[email]', email)
  }

  const res = await fetch(`${getBaseUrl()}/hosted_pages/checkout_new_for_items`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chargebee checkout failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return { url: data.hosted_page.url }
}
