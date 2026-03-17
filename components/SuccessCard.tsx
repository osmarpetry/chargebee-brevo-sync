'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

function CopyButton({ value, testId }: { value: string; testId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  return (
    <button
      onClick={handleCopy}
      data-testid={testId}
      title="Copy to clipboard"
      className="ml-2 p-1 rounded text-[#999] hover:text-[#4b92d9] hover:bg-[#333] transition-colors cursor-pointer"
    >
      {copied ? (
        <svg className="w-4 h-4 text-[#088869]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

function CopyRow({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="flex items-center justify-between bg-[#1a1a1a] border border-[#333] rounded-[0.8rem] px-4 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-[#999] mb-0.5">{label}</p>
        <p className="text-sm font-medium text-white truncate" data-testid={`${testId}-value`}>{value}</p>
      </div>
      <CopyButton value={value} testId={testId} />
    </div>
  )
}

export default function SuccessCard() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('id') ?? ''
  const email = searchParams.get('email') ?? ''

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center px-4">
      <div className="bg-[#1f1f1f] border border-[#333] rounded-[1.6rem] p-8 sm:p-10 w-full max-w-md text-center">
        {/* Success icon */}
        <div className="w-14 h-14 bg-[#088869]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#088869]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Subscription confirmed</h1>
        <p className="text-sm text-[#999] mb-8">
          Your Passbolt Cloud subscription is now active.
        </p>

        {/* Order details */}
        {(orderId || email) && (
          <div className="space-y-3 mb-8 text-left">
            {orderId && (
              <CopyRow label="Order ID" value={orderId} testId="copy-order-id" />
            )}
            {email && (
              <CopyRow label="Email" value={email} testId="copy-email" />
            )}
          </div>
        )}

        <a
          href="/pricing"
          className="inline-block px-6 py-2.5 bg-[#4b92d9] hover:bg-[#3a7fc4] text-white text-sm font-semibold rounded-[0.8rem] transition-colors"
        >
          Back to Pricing
        </a>
      </div>
    </div>
  )
}
