import { test, expect } from "@playwright/test";

/**
 * E2E checkout flow using ChargeBee test card 4111 1111 1111 1111.
 *
 * Prerequisites:
 * - Dev server running on http://localhost (bun run dev)
 * - CHARGEBEE_SITE and CHARGEBEE_API_KEY env vars set (test mode)
 * - NEXT_PUBLIC_STANDARD_PRICE_ID set to a valid test item price ID
 */

const TEST_EMAIL = `playwright+${Date.now()}@osmarpetry.dev`;

test.describe("Checkout flow", () => {
  test("full purchase with 4111 test card shows success page", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Skip ngrok browser-warning interstitial (free tier shows it on first visit)
    await page.setExtraHTTPHeaders({ "ngrok-skip-browser-warning": "true" });

    // 1. Navigate to pricing page
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: "Simple, transparent pricing" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Passbolt Docker" }),
    ).toBeVisible();

    // 2. Click "Get Started"
    await page
      .getByRole("button", { name: /get started/i, exact: false })
      .click();

    // 3. Email modal appears
    const modal = page.getByRole("dialog", {
      name: /get started with passbolt docker/i,
    });
    await expect(modal).toBeVisible();

    // Assert modal subtitle text matches the UI
    await expect(
      modal.getByText("Enter your email to continue to checkout."),
    ).toBeVisible();

    // 4. Email input starts empty — type test email
    const emailInput = page.getByLabel("Email address");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue("");

    // Use pressSequentially to trigger react-hook-form onChange validation
    await emailInput.pressSequentially(TEST_EMAIL, { delay: 30 });

    // 5. "Checkout" button re-enables once a valid email is typed
    const checkoutBtn = modal.getByRole("button", { name: "Checkout" });
    await expect(checkoutBtn).toBeEnabled();
    await checkoutBtn.click();

    // 6. Wait for Chargebee hosted checkout page
    await page.waitForURL(/chargebee\.com/, { timeout: 30_000 });

    // 7. Chargebee cart review — proceed to payment form
    await page.getByRole("button", { name: "Proceed To Checkout" }).click();

    // 8. Wait for checkout form (card iframes) to fully load
    await page.waitForLoadState("networkidle", { timeout: 30_000 });

    // 9. Fill required billing address fields
    await page.getByLabel("First Name", { exact: true }).fill("Osmar");
    await page.getByLabel("Last Name", { exact: true }).fill("Petry");
    await page.getByLabel("Address Line1").fill("123 Test Street");
    await page.getByLabel("City").fill("Luxembourg");
    await page.getByLabel("State").fill("Luxembourg");
    await page.getByLabel("Country").selectOption("Luxembourg");

    // 10. Fill card details inside Chargebee iframes

    // --- Card Number ---
    const cardNumberInput = page
      .frameLocator("iframe#card-number_frame")
      .getByRole("textbox");
    await cardNumberInput.waitFor({ state: "visible", timeout: 30_000 });
    await cardNumberInput.pressSequentially("4111111111111111", { delay: 50 });
    await cardNumberInput.press("Tab");

    // --- Expiry ---
    const expiryInput = page
      .frameLocator("iframe#card-expiry_month_frame")
      .getByRole("textbox");
    await expiryInput.pressSequentially("1226", { delay: 50 });
    await expiryInput.press("Tab");

    // --- CVV ---
    const cvvInput = page
      .frameLocator("iframe#card-cvv_frame")
      .getByRole("textbox");
    await cvvInput.pressSequentially("123", { delay: 50 });
    await cvvInput.press("Tab");

    // 11. Submit via stable ID
    await page.locator("#submit-btn").click();

    // 12. Wait for redirect back to success page
    await page.waitForURL(/\/checkout\/success/, { timeout: 90_000 });

    // 13. Assert success page content
    await expect(
      page.getByRole("heading", { name: "Subscription confirmed" }),
    ).toBeVisible();

    const orderIdValue = page.getByTestId("copy-order-id-value");
    await expect(orderIdValue).toBeVisible();
    const orderId = await orderIdValue.textContent();
    expect(orderId?.trim().length).toBeGreaterThan(0);

    const emailValue = page.getByTestId("copy-email-value");
    await expect(emailValue).toBeVisible();
    await expect(emailValue).toHaveText(TEST_EMAIL);

    await expect(page.getByTestId("copy-order-id")).toBeVisible();
    await expect(page.getByTestId("copy-email")).toBeVisible();
  });
});
