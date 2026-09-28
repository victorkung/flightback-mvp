// The only file that knows about the flight data provider (AeroDataBox via RapidAPI).
// To move to FlightAware AeroAPI, rewrite this file and keep getFlightArrival's contract.
import "server-only";
import type { FlightArrival } from "./types";

export class FlightProviderError extends Error {}

type AdbTime = { utc?: string; local?: string };
type AdbAirport = { iata?: string; municipalityName?: string; shortName?: string; countryCode?: string };
type AdbMovement = {
  airport?: AdbAirport;
  scheduledTime?: AdbTime;
  revisedTime?: AdbTime;
  predictedTime?: AdbTime;
  runwayTime?: AdbTime;
};
type AdbFlight = {
  number?: string;
  status?: string;
  airline?: { name?: string };
  departure?: AdbMovement;
  arrival?: AdbMovement;
};

// AeroDataBox times look like "2025-06-01 18:25Z" (utc) and "2025-06-01 14:25-04:00" (local).
const toIso = (t?: string) => {
  if (!t) return null;
  const d = new Date(t.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const LANDED = new Set(["Arrived"]);

/*
 * Which arrival time counts as actual:
 * For a landed flight AeroDataBox returns scheduledTime, revisedTime and usually runwayTime.
 * - revisedTime on a landed flight is the actual gate (in-block) arrival. That is when
 *   passengers actually reach the destination, so it is our first choice.
 * - runwayTime is touchdown. We fall back to it when revisedTime is missing.
 * - predictedTime is a model estimate and is never used.
 * We only trust these fields once status is Arrived; before that, revisedTime is an estimate.
 * All math is done on the UTC variants.
 */
function actualArrival(f: AdbFlight): string | null {
  if (!LANDED.has(f.status ?? "")) return null;
  return toIso(f.arrival?.revisedTime?.utc) ?? toIso(f.arrival?.runwayTime?.utc);
}

function airport(a?: AdbAirport) {
  return {
    iata: a?.iata ?? "",
    city: a?.municipalityName ?? a?.shortName ?? "",
    country: a?.countryCode ?? "",
  };
}

function normalize(f: AdbFlight, flightNumber: string, date: string): FlightArrival | null {
  const scheduled = toIso(f.arrival?.scheduledTime?.utc);
  if (!scheduled) return null;
  const actual = actualArrival(f);
  return {
    flightNumber,
    date,
    origin: airport(f.departure?.airport),
    destination: airport(f.arrival?.airport),
    scheduledArrivalUtc: scheduled,
    actualArrivalUtc: actual,
    delayMinutes: actual ? Math.round((Date.parse(actual) - Date.parse(scheduled)) / 60000) : null,
    status: f.status ?? "Unknown",
    airline: f.airline?.name ?? "",
  };
}

// Per-instance cache. The free plan allows roughly 300 lookups a month.
const cache = new Map<string, Promise<FlightArrival | null>>();

/** Returns the normalized flight, or null when the provider has no such flight. */
export function getFlightArrival(flightNumber: string, date: string): Promise<FlightArrival | null> {
  const compact = flightNumber.replace(/\s+/g, "").toUpperCase();
  const key = `${compact}|${date}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fetchFlight(compact, date);
  cache.set(key, p);
  // Only cache real answers. Errors should be retryable.
  p.catch(() => cache.delete(key));
  return p;
}

async function fetchFlight(compact: string, date: string): Promise<FlightArrival | null> {
  const key = process.env.AERODATABOX_API_KEY;
  const host = process.env.AERODATABOX_HOST || "aerodatabox.p.rapidapi.com";
  if (!key) throw new FlightProviderError("AERODATABOX_API_KEY is not set");

  const url =
    `https://${host}/flights/number/${encodeURIComponent(compact)}/${date}` +
    `?withAircraftImage=false&withLocation=false&dateLocalRole=Departure`;
  const res = await fetch(url, {
    headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  }).catch((e) => {
    throw new FlightProviderError(`AeroDataBox request failed: ${e}`);
  });

  // 204 and 404 both mean the provider has no such flight.
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new FlightProviderError(`AeroDataBox ${res.status}: ${await res.text().catch(() => "")}`);

  const text = await res.text();
  if (process.env.LOG_FLIGHT_RAW === "1") console.log("[aerodatabox raw]", compact, date, text);
  if (!text) return null;
  const legs = JSON.parse(text) as AdbFlight[];
  if (!Array.isArray(legs) || legs.length === 0) return null;

  // A flight number can have several legs. Keep legs departing on the requested local date.
  // If more than one remains (a multi-stop flight), take the one that arrives last, since we
  // ask for the flight that reached the final destination. The UI shows the route checked.
  const sameDay = legs.filter((l) => l.departure?.scheduledTime?.local?.startsWith(date));
  const pool = sameDay.length ? sameDay : legs;
  const byArrival = [...pool].sort(
    (a, b) =>
      Date.parse(toIso(a.arrival?.scheduledTime?.utc) ?? "0") - Date.parse(toIso(b.arrival?.scheduledTime?.utc) ?? "0"),
  );
  const leg = byArrival[byArrival.length - 1];
  return normalize(leg, `${compact.slice(0, 2)} ${compact.slice(2)}`, date);
}
