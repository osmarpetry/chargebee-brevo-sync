/**
 * In-memory idempotency guard for webhook events.
 *
 * ChargeBee retries up to 7x with exponential backoff.
 * We track processed event IDs and auto-expire them after 24h.
 */

const processed = new Map<string, number>()

const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function isProcessed(eventId: string): boolean {
  const ts = processed.get(eventId)
  if (!ts) return false
  if (Date.now() - ts > TTL_MS) {
    processed.delete(eventId)
    return false
  }
  return true
}

export function markProcessed(eventId: string): void {
  processed.set(eventId, Date.now())
  setTimeout(() => processed.delete(eventId), TTL_MS)
}
