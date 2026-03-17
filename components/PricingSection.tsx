"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";

const STANDARD_PRICE_ID =
  process.env.NEXT_PUBLIC_STANDARD_PRICE_ID ?? "standard-plan-monthly-eur";

const plan = {
  name: "Passbolt Docker",
  price: 13.99,
  currency: "€",
  description:
    "Local deployment solution for Passbolt, perfect for developers and teams looking for a self-hosted password manager.",
  cta: "Get Started",
  features: [
    "ChargeBee & HubSpot Integration Management",
    "Cloud Functions & Vulnerability Patching",
    "Complex Identity Provider Adapters",
    "Figma to React Component Development (Design Tokens)",
    "Proactive Problem Solving & Technical Debt Reduction",
    "Collaborative Team Player with Initiative",
  ],
  itemPriceId: STANDARD_PRICE_ID,
};

type CheckoutFormValues = {
  email: string;
};

export default function PricingSection() {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted, isValid },
  } = useForm<CheckoutFormValues>({
    mode: "onChange",
    defaultValues: { email: "" },
  });

  // Merge react-hook-form ref with our focus ref
  const { ref: rhfRef, ...emailRest } = register("email", {
    required: "Email address is required.",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address.",
    },
  });

  useEffect(() => {
    if (modalOpen) emailInputRef.current?.focus();
  }, [modalOpen]);

  function handleGetStarted() {
    reset({ email: "" });
    setServerError("");
    setModalOpen(true);
  }

  async function onSubmit(data: CheckoutFormValues) {
    setLoading(true);
    setServerError("");

    try {
      const res = await fetch("/api/chargebee/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemPriceId: plan.itemPriceId,
          email: data.email,
        }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setServerError(json.error ?? "Failed to create checkout session.");
      }
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Allow clicking submit always, but disable after first submit attempt if invalid
  const isSubmitDisabled = loading || (isSubmitted && !isValid);

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Minimal nav */}
      <nav
        className="bg-[#171717] border-b border-[#333] px-4 sm:px-8"
        style={{ height: "64px" }}
        aria-label="Main navigation"
      >
        <div className="h-full max-w-5xl mx-auto flex items-center justify-between">
          <a href="/pricing" aria-label="Passbolt — go to pricing">
            <Image
              src="/logo_white.svg"
              alt="Passbolt"
              width={120}
              height={23}
              priority
            />
          </a>
          <span className="text-sm text-[#999] hidden sm:block">
            ChargeBee + Brevo Demo
          </span>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-base sm:text-lg text-[#999] max-w-md mx-auto">
            Choose the plan that works for you. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Single plan card */}
        <div className="bg-[#1f1f1f] border border-[#333] rounded-[1.6rem] w-full sm:max-w-sm mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">{plan.name}</h2>
            <p className="text-sm text-[#b3b3b3] leading-relaxed">
              {plan.description}
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">
                {plan.currency}
                {plan.price}
              </span>
              <span className="text-[#999] mb-1 text-sm">/mo</span>
            </div>
          </div>

          <button
            onClick={handleGetStarted}
            disabled={loading}
            aria-label={`Get started with ${plan.name}`}
            className="w-full py-3 rounded-[0.8rem] text-sm font-semibold bg-[#4b92d9] hover:bg-[#3a7fc4] text-white transition-colors mb-8 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Loading…" : plan.cta}
          </button>

          <ul className="space-y-3" aria-label="Plan features">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 text-sm text-[#b3b3b3]"
              >
                <svg
                  className="w-4 h-4 text-[#088869] shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer pinned to bottom via flex layout */}
      <footer className="py-6 text-center border-t border-[#222]">
        <p className="text-sm text-[#999]">
          All plans include &middot; Brevo CRM sync &middot; ChargeBee webhook
          integration &middot; SSL &middot; GDPR compliant
        </p>
        <p className="text-xs text-[#666] mt-2">
          Questions?{" "}
          <a
            href="mailto:osmar@osmarpetry.dev"
            className="underline hover:text-[#999]"
          >
            osmar@osmarpetry.dev
          </a>
        </p>
      </footer>

      {/* Email modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
        >
          <div
            className="bg-[#1f1f1f] rounded-[1.6rem] shadow-xl border border-[#333] w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="checkout-modal-title"
              className="text-lg font-bold text-white mb-1"
            >
              Get started with {plan.name}
            </h3>
            <p className="text-sm text-[#999] mb-6">
              Enter your email to continue to checkout.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <label
                htmlFor="checkout-email"
                className="block text-sm font-medium text-[#b3b3b3] mb-1.5"
              >
                Email address
              </label>
              <input
                {...emailRest}
                ref={(el) => {
                  rhfRef(el);
                  emailInputRef.current = el;
                }}
                id="checkout-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={
                  errors.email ? "checkout-email-error" : undefined
                }
                className={`w-full px-4 py-2.5 bg-[#171717] border rounded-[0.8rem] text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#4b92d9] focus:border-[#4b92d9] transition-colors ${
                  errors.email ? "border-[#d40101]" : "border-[#333]"
                }`}
              />

              {errors.email && (
                <p
                  id="checkout-email-error"
                  className="text-xs text-[#d40101] mt-1.5"
                  role="alert"
                  aria-live="polite"
                >
                  {errors.email.message}
                </p>
              )}

              {serverError && (
                <p
                  className="text-xs text-[#d40101] mt-1.5"
                  role="alert"
                  aria-live="polite"
                >
                  {serverError}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-[0.8rem] text-sm font-medium border border-[#333] text-[#999] hover:bg-[#333] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  aria-label="Continue to checkout"
                  aria-disabled={isSubmitDisabled}
                  className="flex-1 py-2.5 rounded-[0.8rem] text-sm font-semibold bg-[#4b92d9] hover:bg-[#3a7fc4] text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {loading ? "Loading…" : "Checkout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
