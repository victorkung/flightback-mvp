import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export const stripeKeyIsTest = () => (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");

/** Throws unless a test mode secret key is configured. This site must never touch live mode. */
export function getStripe(): Stripe {
  if (!stripeKeyIsTest()) throw new Error("STRIPE_SECRET_KEY must be a test key (sk_test_). Refusing to run.");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}
