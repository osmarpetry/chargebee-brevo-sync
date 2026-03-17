export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md text-center shadow-sm">
        <div className="w-14 h-14 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Subscription confirmed</h1>
        <p className="text-gray-400 mb-8">
          Your subscription is now active.
        </p>
        <a
          href="/pricing"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          Back to Pricing
        </a>
      </div>
    </div>
  )
}
