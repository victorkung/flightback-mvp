import { flightRule } from "@/lib/eligibility";
import { OFFER_PCT, owedFor } from "@/lib/constants";
import { routeLabel } from "@/lib/format";
import { getStripe, stripeKeyIsTest } from "@/lib/stripe";
import type { FlightArrival, SubmitPayload } from "@/lib/types";
import {
  codeError,
  emailError,
  fairAmountError,
  flightNumberError,
  nameError,
  normalizeCode,
  normalizeTicket,
  passengersError,
  ticketError,
} from "@/lib/validation";

const str = (v: unknown) => (typeof v === "string" ? v : "");

// Sheets treats a leading = + - @ as a formula. Neutralize user text before it lands in a cell.
const cell = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);

function parseFlight(f: unknown): FlightArrival | null {
  if (!f || typeof f !== "object") return null;
  const o = f as Record<string, unknown>;
  const ap = (a: unknown) => {
    const r = (a ?? {}) as Record<string, unknown>;
    return { iata: str(r.iata), city: str(r.city), country: str(r.country) };
  };
  const flight: FlightArrival = {
    flightNumber: str(o.flightNumber),
    date: str(o.date),
    origin: ap(o.origin),
    destination: ap(o.destination),
    scheduledArrivalUtc: str(o.scheduledArrivalUtc),
    actualArrivalUtc: str(o.actualArrivalUtc) || null,
    delayMinutes: typeof o.delayMinutes === "number" ? o.delayMinutes : null,
    status: str(o.status),
    airline: str(o.airline),
  };
  if (flightNumberError(flight.flightNumber) || !/^\d{4}-\d{2}-\d{2}$/.test(flight.date)) return null;
  return flight;
}

function validate(body: unknown): { data: SubmitPayload } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const flight = parseFlight(b.flight);
  if (!flight || !flightRule(flight).eligible) return { error: "Flight details are missing or not eligible." };

  const passengers = Number(b.passengers);
  const d = (b.details ?? {}) as Record<string, unknown>;
  const names = Array.isArray(d.names) ? d.names.map(str).map((s) => s.trim()) : [];
  const tickets = Array.isArray(d.tickets) ? d.tickets.map(str).map(normalizeTicket) : [];
  const confirmationCode = normalizeCode(str(d.confirmationCode));
  const email = str(d.email).trim();
  const payout = d.payout === "cash" || d.payout === "credit" ? d.payout : null;
  const feeModel = b.feeModel === "success" || b.feeModel === "monthly" ? b.feeModel : null;
  const fairAmount = Number(b.fairAmount);
  const s = (b.stripe ?? {}) as Record<string, unknown>;

  const err =
    passengersError(passengers) ??
    (names.length !== passengers || tickets.length !== passengers ? "One name and ticket per passenger." : null) ??
    names.map(nameError).find(Boolean) ??
    tickets.map(ticketError).find(Boolean) ??
    codeError(confirmationCode) ??
    emailError(email) ??
    (payout ? null : "Choose a payout preference.") ??
    (feeModel ? null : "Choose a fee model.") ??
    fairAmountError(fairAmount) ??
    (b.permission === true ? null : "Permission is required.") ??
    (/^FB-[A-Z0-9]{6}$/.test(str(b.claimId)) ? null : "Missing claim ID.") ??
    (str(s.setupIntentId).startsWith("seti_") ? null : "Missing card setup.");
  if (err) return { error: err };

  return {
    data: {
      claimId: str(b.claimId),
      flight,
      passengers,
      details: { confirmationCode, names, tickets, payout: payout!, email },
      feeModel: feeModel!,
      fairAmount,
      stripe: {
        customerId: str(s.customerId),
        paymentMethodId: str(s.paymentMethodId),
        setupIntentId: str(s.setupIntentId),
      },
      permission: true,
    },
  };
}

export async function POST(request: Request) {
  if (!stripeKeyIsTest()) return Response.json({ error: "Not available right now." }, { status: 503 });

  const result = validate(await request.json().catch(() => null));
  if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
  const p = result.data;

  // Trust Stripe, not the browser, for the card step: the SetupIntent must have succeeded
  // and belong to this claim. Its IDs are what we store.
  const stripe = getStripe();
  let intent;
  try {
    intent = await stripe.setupIntents.retrieve(p.stripe.setupIntentId);
  } catch (e) {
    console.error("[submit] SetupIntent lookup failed", e);
    return Response.json({ error: "We couldn't confirm your card." }, { status: 400 });
  }
  const customerId = typeof intent.customer === "string" ? intent.customer : intent.customer?.id ?? "";
  const paymentMethodId =
    typeof intent.payment_method === "string" ? intent.payment_method : intent.payment_method?.id ?? "";
  if (intent.status !== "succeeded" || intent.metadata?.claimId !== p.claimId || !paymentMethodId) {
    return Response.json({ error: "We couldn't confirm your card." }, { status: 400 });
  }

  // One row per claim, even if the browser retries. The flag lives on the SetupIntent so it
  // holds across server instances.
  if (intent.metadata?.submitted === "true") return Response.json({ ok: true, claimId: p.claimId, duplicate: true });

  const owed = owedFor(p.passengers);
  const row = [
    new Date().toISOString(),
    p.claimId,
    cell(p.details.email),
    p.flight.flightNumber,
    p.flight.date,
    routeLabel(p.flight),
    p.flight.scheduledArrivalUtc,
    p.flight.actualArrivalUtc,
    p.flight.delayMinutes,
    p.passengers,
    owed,
    p.details.names.map(cell).join("; "),
    p.details.tickets.join("; "),
    p.details.confirmationCode,
    p.details.payout,
    p.feeModel,
    p.fairAmount,
    OFFER_PCT,
    customerId,
    paymentMethodId,
    intent.id,
    p.permission,
  ];

  // Mark first so a retry cannot double-write. If the sheet write then fails, the row is in the logs.
  await stripe.setupIntents
    .update(intent.id, { metadata: { submitted: "true" } })
    .catch((e) => console.error("[submit] could not flag SetupIntent", e));

  const sent = await sendToSheet(row);
  if (!sent) console.error("[submit] sheet write failed. Row for manual entry:", JSON.stringify(row));

  // The traveler sees the confirmation either way. We fix sheet problems by hand.
  return Response.json({ ok: true, claimId: p.claimId });
}

async function sendToSheet(row: unknown[]): Promise<boolean> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.error("[submit] SHEETS_WEBHOOK_URL or SHEETS_WEBHOOK_SECRET is not set");
    return false;
  }
  try {
    // Apps Script answers with a redirect to the script output. fetch follows it.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, row }),
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let ok = false;
    try {
      ok = JSON.parse(text)?.ok === true;
    } catch {}
    if (!ok) console.error("[submit] sheet responded", res.status, text.slice(0, 300));
    return ok;
  } catch (e) {
    console.error("[submit] sheet request failed", e);
    return false;
  }
}
