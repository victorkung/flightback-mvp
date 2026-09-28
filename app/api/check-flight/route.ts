import { dateError, flightNumberError, normalizeFlightNumber } from "@/lib/validation";
import { dateRule, flightRule } from "@/lib/eligibility";
import { FlightProviderError, getFlightTrips } from "@/lib/flights";
import type { CheckResponse, CheckResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const flightNumber = typeof body?.flightNumber === "string" ? body.flightNumber : "";
  const date = typeof body?.date === "string" ? body.date : "";
  const route = typeof body?.route === "string" ? body.route : "";

  const invalid = flightNumberError(flightNumber) ?? dateError(date);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const dateReason = dateRule(date);
  if (dateReason) return Response.json({ eligible: false, reason: dateReason } satisfies CheckResult);

  try {
    const trips = await getFlightTrips(normalizeFlightNumber(flightNumber), date);
    if (trips.length <= 1) return Response.json(flightRule(trips[0] ?? null));

    // Several trips under one number that day. Ask which one, then check only that one.
    const chosen = route ? trips.find((t) => t.route === route) : undefined;
    if (!chosen) {
      const options = trips.map(({ route, origin, destination, via, scheduledDepartureUtc }) => ({
        route,
        origin,
        destination,
        via,
        scheduledDepartureUtc,
      }));
      return Response.json({ chooseRoute: true, options } satisfies CheckResponse);
    }
    return Response.json(flightRule(chosen));
  } catch (e) {
    console.error("[check-flight]", e instanceof FlightProviderError ? e.message : e);
    return Response.json({ error: "We couldn't check flights right now. Try again in a minute." }, { status: 502 });
  }
}
