// The only file that knows about the flight data provider (AeroDataBox via RapidAPI).
// To move to FlightAware AeroAPI, rewrite this file and keep getFlightTrips's contract.
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
 * Which arrival time counts as actual. Checked against real responses (AA 2256 and the ORD
 * arrivals board for 2026-09-27):
 * - A landed flight (status "Arrived") has arrival.scheduledTime, revisedTime and runwayTime,
 *   each with utc and local variants. There is no separate "actual" field.
 * - runwayTime is observed touchdown.
 * - revisedTime is the gate (in-block) arrival. It can be an estimate made just after
 *   touchdown (AA 2256: runway 02:04Z, revised 02:16Z, lastUpdated 02:09Z), and on bad days it
 *   runs hours past touchdown while planes wait for a gate.
 * We use revisedTime, because reaching the gate is when passengers actually arrive, and fall
 * back to runwayTime when revisedTime is missing or earlier than touchdown (impossible for a
 * gate time). predictedTime is a model estimate and is never used. Before status is Arrived,
 * none of these are final, so we return null. All math uses the UTC variants.
 */
function actualArrival(f: AdbFlight): string | null {
  if (!LANDED.has(f.status ?? "")) return null;
  const gate = toIso(f.arrival?.revisedTime?.utc);
  const runway = toIso(f.arrival?.runwayTime?.utc);
  if (gate && runway && Date.parse(gate) < Date.parse(runway)) return runway;
  return gate ?? runway;
}

function airport(a?: AdbAirport) {
  return {
    iata: a?.iata ?? "",
    city: a?.municipalityName ?? a?.shortName ?? "",
    country: a?.countryCode ?? "",
  };
}

const minutesBetween = (from: string | null, to: string | null) =>
  from && to ? Math.round((Date.parse(to) - Date.parse(from)) / 60000) : null;

/**
 * One trip over legs[i..j], flown as a single through flight. Delay is judged at the last
 * leg's arrival, since that is when the traveler reached their destination. A cancelled or
 * diverted leg anywhere on the way sets the status for the whole trip.
 */
function toTrip(legs: AdbFlight[], flightNumber: string, date: string): FlightArrival {
  const first = legs[0];
  const last = legs[legs.length - 1];
  const scheduled = toIso(last.arrival?.scheduledTime?.utc);
  const actual = actualArrival(last);
  const disrupted = legs.find((l) => /cancel|divert/i.test(l.status ?? ""));
  const origin = airport(first.departure?.airport);
  const destination = airport(last.arrival?.airport);
  return {
    flightNumber,
    date,
    route: `${origin.iata}-${destination.iata}`,
    origin,
    destination,
    via: legs.slice(1).map((l) => airport(l.departure?.airport)),
    scheduledDepartureUtc: toIso(first.departure?.scheduledTime?.utc),
    scheduledArrivalUtc: scheduled,
    actualArrivalUtc: actual,
    delayMinutes: minutesBetween(scheduled, actual),
    status: disrupted?.status ?? last.status ?? "Unknown",
    airline: last.airline?.name ?? first.airline?.name ?? "",
  };
}

// Per-instance cache, so choosing a route after a lookup costs nothing. The free plan allows
// about 200 lookups a month.
const cache = new Map<string, Promise<FlightArrival[]>>();

/**
 * Every trip this flight number made on this date (local to the departure airport), in
 * departure order. Usually one. A multi-stop flight such as MCI to MKE to ORD gives each leg
 * plus the through trip MCI to ORD. Empty when the provider has no such flight.
 */
export function getFlightTrips(flightNumber: string, date: string): Promise<FlightArrival[]> {
  const compact = flightNumber.replace(/\s+/g, "").toUpperCase();
  const key = `${compact}|${date}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fetchTrips(compact, date);
  cache.set(key, p);
  // Only cache real answers. Errors should be retryable.
  p.catch(() => cache.delete(key));
  return p;
}

async function fetchTrips(compact: string, date: string): Promise<FlightArrival[]> {
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
  if (res.status === 204 || res.status === 404) return [];
  if (!res.ok) throw new FlightProviderError(`AeroDataBox ${res.status}: ${await res.text().catch(() => "")}`);

  const text = await res.text();
  if (process.env.LOG_FLIGHT_RAW === "1") console.log("[aerodatabox raw]", compact, date, text);
  if (!text) return [];
  const all = JSON.parse(text) as AdbFlight[];
  if (!Array.isArray(all) || all.length === 0) return [];

  // Keep legs departing on the requested local date, in departure order.
  const sameDay = all.filter((l) => l.departure?.scheduledTime?.local?.startsWith(date));
  const legs = (sameDay.length ? sameDay : all).sort(
    (a, b) =>
      Date.parse(toIso(a.departure?.scheduledTime?.utc) ?? "0") -
      Date.parse(toIso(b.departure?.scheduledTime?.utc) ?? "0"),
  );

  // Every run of connected legs is a trip someone could have taken: each leg on its own, and
  // each through trip where one leg lands where the next takes off (UA 5680 on 2026-09-27 was
  // MCI to MKE to ORD). Legs that don't connect stay separate trips.
  const flightNumber = `${compact.slice(0, 2)} ${compact.slice(2)}`;
  const trips: FlightArrival[] = [];
  for (let i = 0; i < legs.length; i++) {
    for (let j = i; j < legs.length; j++) {
      if (j > i && legs[j].departure?.airport?.iata !== legs[j - 1].arrival?.airport?.iata) break;
      trips.push(toTrip(legs.slice(i, j + 1), flightNumber, date));
    }
  }
  // The same route twice in a day (rare) needs the departure time to tell them apart.
  const counts = new Map<string, number>();
  for (const t of trips) counts.set(t.route, (counts.get(t.route) ?? 0) + 1);
  for (const t of trips) if (counts.get(t.route)! > 1) t.route += `@${t.scheduledDepartureUtc ?? ""}`;
  return trips;
}
