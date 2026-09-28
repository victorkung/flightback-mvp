import { randomInt } from "node:crypto";
import { getStripe, stripeKeyIsTest } from "@/lib/stripe";
import { emailError, nameError } from "@/lib/validation";

// No 0/O or 1/I so the ID is easy to read back over the phone.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newClaimId = () => "FB-" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export async function POST(request: Request) {
  if (!stripeKeyIsTest()) {
    console.error("[setup-intent] refusing to run without a sk_test_ key");
    return Response.json({ error: "Card saving is not available right now." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const invalid = emailError(email) ?? nameError(name);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  try {
    const stripe = getStripe();
    const claimId = newClaimId();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { claimId, email },
    });
    const intent = await stripe.setupIntents.create({
      customer: customer.id,
      usage: "off_session",
      // No redirect-based methods, so the card step always finishes on our page.
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { claimId },
    });
    return Response.json({ clientSecret: intent.client_secret, customerId: customer.id, claimId });
  } catch (e) {
    console.error("[setup-intent]", e);
    return Response.json({ error: "We couldn't start the card step. Try again in a minute." }, { status: 502 });
  }
}
