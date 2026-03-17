'use client'

import { useState, useRef, useEffect } from 'react'

const STANDARD_WITH_ADS_PRICE_ID = process.env.NEXT_PUBLIC_STANDARD_WITH_ADS_PRICE_ID ?? 'standard-with-ads-plan-monthly-eur'
const STANDARD_PRICE_ID = process.env.NEXT_PUBLIC_STANDARD_PRICE_ID ?? 'standard-plan-monthly-eur'
const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_PREMIUM_PRICE_ID ?? 'premium-plan-monthly-eur'

function generateEmail() {
  const now = new Date()
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  return `osmarpetry+${ts}@gmail.com`
}

const plans = [
  {
    name: 'Standard with ads',
    price: 4.99,
    currency: '\u20AC',
    description: 'Great video quality in Full HD (1080p). Stream on 2 supported devices at a time with ads.',
    cta: 'Subscribe',
    ctaStyle: 'border border-gray-600 text-gray-300 hover:bg-gray-700',
    features: [
      'Full HD (1080p)',
      '2 devices at a time',
      'Ad-supported',
      'Download on 2 devices',
    ],
    highlight: false,
    itemPriceId: STANDARD_WITH_ADS_PRICE_ID,
  },
  {
    name: 'Standard',
    price: 13.99,
    currency: '\u20AC',
    description: 'Great video quality in Full HD (1080p). Stream on 2 supported devices at a time with no ads.',
    cta: 'Subscribe',
    ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700',
    features: [
      'Full HD (1080p)',
      '2 devices at a time',
      'No ads',
      'Download on 2 devices',
      'Spatial audio',
    ],
    highlight: true,
    itemPriceId: STANDARD_PRICE_ID,
  },
  {
    name: 'Premium',
    price: 19.99,
    currency: '\u20AC',
    description: 'Best video quality in Ultra HD (4K) and HDR. Stream on 4 supported devices at a time with no ads.',
    cta: 'Subscribe',
    ctaStyle: 'border border-gray-600 text-gray-300 hover:bg-gray-700',
    features: [
      'Ultra HD (4K) + HDR',
      '4 devices at a time',
      'No ads',
      'Download on 6 devices',
      'Spatial audio',
      'Netflix spatial audio',
    ],
    highlight: false,
    itemPriceId: PREMIUM_PRICE_ID,
  },
]

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [modalPlan, setModalPlan] = useState<(typeof plans)[number] | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (modalPlan) emailInputRef.current?.focus()
  }, [modalPlan])

  function handleButtonClick(plan: (typeof plans)[number]) {
    if (!plan.itemPriceId) return
    setEmail(generateEmail())
    setError('')
    setModalPlan(plan)
  }

  async function handleSubmitCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!modalPlan?.itemPriceId) return

    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoadingPlan(modalPlan.name)
    setError('')

    try {
      const res = await fetch('/api/chargebee/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemPriceId: modalPlan.itemPriceId, email: trimmed }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Failed to create checkout session.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-gray-100 text-lg">
          <span className="text-blue-500">CB</span>Demo
        </span>
        <span className="text-sm text-gray-500">
          ChargeBee + Brevo Demo
        </span>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Choose the plan that works for you. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isLoading = loadingPlan === plan.name
            return (
              <div
                key={plan.name}
                className={`relative bg-gray-900 rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                    : 'border-gray-800'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-100 mb-1">{plan.name}</h2>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-gray-100">{plan.currency}{plan.price}</span>
                    <span className="text-gray-500 mb-1 text-sm">/mo</span>
                  </div>
                </div>

                <button
                  onClick={() => handleButtonClick(plan)}
                  disabled={isLoading}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors mb-8 disabled:opacity-60 ${plan.ctaStyle}`}
                >
                  {isLoading ? 'Loading...' : plan.cta}
                </button>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* FAQ strip */}
        <div className="mt-20 text-center">
          <p className="text-sm text-gray-500">
            All plans include &middot; Brevo CRM sync &middot; ChargeBee webhook integration &middot; SSL &middot; GDPR compliant
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Questions?{' '}
            <a href="mailto:osmar@osmarpetry.dev" className="underline hover:text-gray-400">
              osmar@osmarpetry.dev
            </a>
          </p>
        </div>
      </div>

      {/* Email modal */}
      {modalPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModalPlan(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl shadow-xl border border-gray-700 w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-100 mb-1">
              Start your {modalPlan.name} plan
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Enter your email to continue to checkout.
            </p>

            <form onSubmit={handleSubmitCheckout}>
              <label htmlFor="checkout-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                ref={emailInputRef}
                id="checkout-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {error && (
                <p className="text-xs text-red-400 mt-1.5">{error}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalPlan(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingPlan === modalPlan.name}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {loadingPlan === modalPlan.name ? 'Loading...' : 'Continue to checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
