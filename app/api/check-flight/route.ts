import { dateError, flightNumberError, normalizeFlightNumber } from "@/lib/validation";
import { dateRule, flightRule } from "@/lib/eligibility";
import { FlightProviderError, getFlightArrival } from "@/lib/flights";
import type { CheckResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const flightNumber = typeof body?.flightNumber === "string" ? body.flightNumber : "";
  const date = typeof body?.date === "string" ? body.date : "";

  const invalid = flightNumberError(flightNumber) ?? dateError(date);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const dateReason = dateRule(date);
  if (dateReason) return Response.json({ eligible: false, reason: dateReason } satisfies CheckResult);

  try {
    const flight = await getFlightArrival(normalizeFlightNumber(flightNumber), date);
    return Response.json(flightRule(flight));
  } catch (e) {
    console.error("[check-flight]", e instanceof FlightProviderError ? e.message : e);
    return Response.json({ error: "We couldn't check flights right now. Try again in a minute." }, { status: 502 });
  }
}
