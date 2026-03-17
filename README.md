# ChargeBee → Brevo Integration Demo

A technical demo replicating the core integration challenge faced by the Passbolt team: receiving ChargeBee webhooks and synchronizing contacts to a CRM (Brevo) via Next.js API Routes — no database, stateless, event-driven.

**Live:** [demo.osmarpetry.dev](https://demo.osmarpetry.dev)

## Architecture

```
User                 ChargeBee                    Next.js                         Brevo CRM
 │                      │                            │                               │
 ├──── /pricing ───────►│                            │                               │
 │     select plan      │                            │                               │
 │     enter email      │                            │                               │
 │                      │                            │                               │
 ├──── POST /api/chargebee/checkout ────────────────►│                               │
 │                      │     createHostedCheckout   │                               │
 │◄─── redirect to ─────┤◄──────────────────────────┤                               │
 │     ChargeBee page   │                            │                               │
 │                      │                            │                               │
 │     (payment)        │                            │                               │
 │                      │                            │                               │
 │  /checkout/success ◄─┤                            │                               │
 │                      │                            │                               │
 │                      ├── POST /api/webhook/chargebee ─►│                          │
 │                      │   Authorization: Basic ...  │   ├── 1. Verify Basic Auth   │
 │                      │                            │   ├── 2. Idempotency check    │
 │                      │                            │   ├── 3. Route by event_type  │
 │                      │                            │   └── 4. Sync to Brevo ──────►│
 │                      │                            │        upsert contact         │
 │                      │                            │        move between lists     │
```

## Why these decisions

| Decision | Justification |
|---|---|
| No database | *"On ne se sert pas du tout de base de données. On dépend uniquement des Webhooks de ChargeBee pour nous donner les informations... on ne stocke rien."* — Gaesten. ("We don't use database at all. We only depend on ChargeBee Webhooks to give us information... we don't store anything.") |
| Event-driven webhooks | *"ChargeBee est notre source of truth. On a juste besoin de réagir quand un event arrive."* — Gaesten. ("ChargeBee is our source of truth. We just need to react when an event arrives.") |
| Simplify the stack | *"On a besoin d'améliorer, rationaliser et, si possible, simplifier ce qu'on a."* — Vivien. ("We need to improve, rationalize and, if possible, simplify what we have.") |
| ChargeBee + CRM focus | *"Le plus gros pain point... c'est principalement l'intégration avec ChargeBee et HubSpot."* — Vivien. ("The biggest pain point... is mainly the integration with ChargeBee and HubSpot.") |

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Redirects to `/pricing` |
| `GET` | `/pricing` | Pricing page — 3 plans, email modal, initiates checkout |
| `GET` | `/checkout/success` | Post-payment confirmation |
| `POST` | `/api/chargebee/checkout` | Creates a ChargeBee hosted checkout session |
| `GET` | `/api/chargebee/items` | Lists item prices from ChargeBee catalog (debug) |
| `POST` | `/api/webhook/chargebee` | Receives ChargeBee webhooks (Basic Auth + idempotency + Brevo sync) |

## Project structure

```
app/
  page.tsx                          → redirect to /pricing
  pricing/page.tsx                  → 3 plans, email modal, checkout
  checkout/success/page.tsx         → post-payment confirmation
  api/
    chargebee/
      checkout/route.ts             → create hosted checkout (POST)
      items/route.ts                → list item prices (GET)
    webhook/
      chargebee/route.ts            → receive ChargeBee webhooks (POST)
lib/
  chargebee.ts                      → createHostedCheckout, listItemPrices
  brevo.ts                          → lifecycle handlers (activated/cancelled/paymentFailed/reactivated)
  verify-webhook.ts                 → Basic Auth verification
  idempotency.ts                    → dedup by ChargeBee event ID (in-memory, 24h TTL)
```

## Setup

```bash
git clone https://github.com/osmarpetry/chargebee-brevo-demo
cd chargebee-brevo-demo
cp .env.example .env.local
# edit .env.local with your values
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/pricing`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BREVO_API_KEY` | Yes | Brevo API key (SMTP & API → API Keys) |
| `BREVO_LIST_LEADS` | No | Brevo list ID for leads (set 0 to skip) |
| `BREVO_LIST_ACTIVE` | No | Brevo list ID for active subscribers |
| `BREVO_LIST_PAST_DUE` | No | Brevo list ID for past-due subscribers |
| `BREVO_LIST_CHURNED` | No | Brevo list ID for churned subscribers |
| `NEXT_PUBLIC_URL` | Yes | Public base URL (no trailing slash) |
| `CHARGEBEE_WEBHOOK_USER` | Yes | Basic Auth username for webhook endpoint |
| `CHARGEBEE_WEBHOOK_PASSWORD` | Yes | Basic Auth password for webhook endpoint |
| `CHARGEBEE_SITE` | Yes | ChargeBee site name (e.g. `underdog853-test`) |
| `CHARGEBEE_API_KEY` | Yes | ChargeBee Full-Access API key |
| `CHARGEBEE_PUBLISHABLE_KEY` | No | ChargeBee publishable key |
| `NEXT_PUBLIC_CHARGEBEE_SITE` | No | ChargeBee site name (client-side) |

## ChargeBee Sandbox configuration

### Webhook setup

In your ChargeBee dashboard: **Settings → Configure Chargebee → API Keys and Webhooks → Webhooks → Add Webhook**

```
Webhook Name:  chargebee-brevo-demo
Webhook URL:   https://<your-domain>/api/webhook/chargebee
```

Enable **"Protect webhook URL with basic authentication"** and set the same credentials as your `CHARGEBEE_WEBHOOK_USER` / `CHARGEBEE_WEBHOOK_PASSWORD`.

### Events to subscribe

```
subscription_created
subscription_activated
subscription_renewed
subscription_cancelled
subscription_reactivated
payment_succeeded
payment_failed
```

> ChargeBee retries up to 7 times with exponential backoff (2 min → 2 days). The webhook route returns `200` for duplicates so ChargeBee stops retrying.

## Brevo configuration

### Lifecycle lists

Create 4 lists in Brevo (**Contacts → Lists**) and set their IDs in `.env.local`:

| List name | Env var | Purpose |
|---|---|---|
| Leads | `BREVO_LIST_LEADS` | New signups before payment |
| Active | `BREVO_LIST_ACTIVE` | Paid subscribers |
| Past Due | `BREVO_LIST_PAST_DUE` | Failed payment |
| Churned | `BREVO_LIST_CHURNED` | Cancelled subscriptions |

### Custom contact attributes

Create these attributes in Brevo (**Settings → Contact attributes**):

| Attribute | Type | Set by |
|---|---|---|
| `CHARGEBEE_STATUS` | Text | Webhook handler (active / past_due / churned) |
| `CHARGEBEE_PLAN` | Text | Plan ID from subscription |
| `CHARGEBEE_EVENT` | Text | Last event type received |

## Testing with ngrok

```bash
# Install
brew install ngrok

# Authenticate (token from https://dashboard.ngrok.com/authtokens)
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel
ngrok http 3000
```

Update `.env.local`:

```env
NEXT_PUBLIC_URL=https://your-domain.ngrok-free.dev
```

Configure the webhook URL in ChargeBee to point to your ngrok URL.

> Sandbox webhook delivery may have a 10–15 min delay — this is normal and doesn't happen in live mode.

## Deploy (Vercel)

```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

Set all environment variables in **Vercel Dashboard → Settings → Environment Variables**.

For custom domain (Cloudflare DNS):

```
Type:    CNAME
Name:    demo
Target:  cname.vercel-dns.com
Proxy:   OFF (DNS only)
```

Then add the domain in **Vercel Dashboard → Settings → Domains**.
