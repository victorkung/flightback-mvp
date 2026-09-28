// Runs once when the server starts. Stripe routes also check this on every call (lib/stripe.ts).
export function register() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key.startsWith("sk_test_")) {
    console.error(
      "[flightback] STRIPE_SECRET_KEY is missing or not a test key (sk_test_). Stripe routes are disabled.",
    );
  }
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  if (pk && !pk.startsWith("pk_test_")) {
    console.error("[flightback] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not a test key (pk_test_).");
  }
}
