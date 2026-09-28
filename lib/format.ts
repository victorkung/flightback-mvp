import type { FlightArrival } from "./types";

export function formatDuration(minutes: number): string {
  const m = Math.abs(Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

export const formatUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

// Shown in the traveler's own time zone, with the zone label so there is no doubt.
// The date is added only when it differs from sameDayAs (YYYY-MM-DD), to keep rows short.
export function formatTime(iso: string, sameDayAs?: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const ymd = d.toLocaleDateString("en-CA");
  if (sameDayAs && ymd === sameDayAs) return time;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

export function formatDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const routeLabel = (f: FlightArrival) => `${f.origin.iata}-${f.destination.iata}`;

export function routeLong(f: FlightArrival): string {
  const place = (a: FlightArrival["origin"]) => (a.city ? `${a.city} (${a.iata})` : a.iata);
  return `${place(f.origin)} to ${place(f.destination)}`;
}

export const airlineName = (f: FlightArrival) => f.airline || "the airline";
