import { MIN_DELAY_MINUTES } from "./constants";
import { formatDuration } from "./format";
import type { CheckResult, FlightArrival } from "./types";

// US states plus US territories covered by US domestic rules.
const US_COUNTRY_CODES = new Set(["US", "PR", "VI", "GU", "AS", "MP"]);

// "Today" is judged in US Eastern time, the earliest mainland US date.
export function todayUs(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

/** Rules 1 and 2. Checked before we spend an API lookup. */
export function dateRule(date: string, now = new Date()): string | null {
  const today = todayUs(now);
  if (date >= today) return "Check back once your flight has landed.";
  if (daysBetween(date, today) > 365) return "We can only check flights from the past year.";
  return null;
}

/** Rules 3 to 8, in order. */
export function flightRule(flight: FlightArrival | null): CheckResult {
  if (!flight) return { eligible: false, reason: "We couldn't find that flight. Check the number and date." };
  const notUs = (c: string) => !US_COUNTRY_CODES.has(c.toUpperCase());
  if (notUs(flight.origin.country) || notUs(flight.destination.country)) {
    return { eligible: false, flight, reason: "Flightback covers US domestic flights only for now." };
  }
  if (/cancel|divert/i.test(flight.status)) {
    return {
      eligible: false,
      flight,
      reason: "This flight was cancelled or diverted. That's a different claim we don't handle yet.",
    };
  }
  if (!flight.actualArrivalUtc || flight.delayMinutes === null) {
    return { eligible: false, flight, reason: "We couldn't confirm when this flight arrived." };
  }
  if (flight.delayMinutes < MIN_DELAY_MINUTES) {
    const when =
      flight.delayMinutes <= 0 ? "on time" : `${formatDuration(flight.delayMinutes)} late`;
    return {
      eligible: false,
      flight,
      reason: `Your flight arrived ${when}. Compensation starts at 3 hours.`,
    };
  }
  return { eligible: true, flight };
}
