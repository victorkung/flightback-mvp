// Shared by the client (fast feedback) and every API route (source of truth).
import { MAX_FAIR_AMOUNT, MAX_PASSENGERS } from "./constants";

const FLIGHT_RE = /^[A-Z0-9]{2} ?\d{1,4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CODE_RE = /^[A-Z0-9]{6}$/;
const TICKET_RE = /^\d{13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Letters from any language, plus spaces, hyphens, apostrophes and periods.
const NAME_RE = /^\p{L}[\p{L}\p{M} .'-]{0,99}$/u;

export const normalizeFlightNumber = (v: string) => v.trim().toUpperCase().replace(/\s+/g, " ");
export const normalizeCode = (v: string) => v.trim().toUpperCase();
export const normalizeTicket = (v: string) => v.replace(/[\s-]/g, "");

export function flightNumberError(v: string): string | null {
  if (!v.trim()) return "Enter your flight number.";
  if (!FLIGHT_RE.test(normalizeFlightNumber(v))) return "Use the airline code and number, like AA 2256.";
  return null;
}

export function dateError(v: string): string | null {
  if (!v) return "Enter the date of your flight.";
  if (!DATE_RE.test(v) || Number.isNaN(Date.parse(v))) return "Enter a valid date.";
  return null;
}

export function passengersError(n: number): string | null {
  if (!Number.isInteger(n) || n < 1 || n > MAX_PASSENGERS) return `Choose 1 to ${MAX_PASSENGERS} passengers.`;
  return null;
}

export function codeError(v: string): string | null {
  if (!v.trim()) return "Enter your confirmation code.";
  if (!CODE_RE.test(normalizeCode(v))) return "Confirmation codes are 6 letters or numbers.";
  return null;
}

export function nameError(v: string): string | null {
  if (!v.trim()) return "Enter this passenger's full name.";
  if (!NAME_RE.test(v.trim())) return "Use letters only, as shown on the ticket.";
  return null;
}

export function ticketError(v: string): string | null {
  if (!v.trim()) return "Enter the ticket number.";
  if (!TICKET_RE.test(normalizeTicket(v))) return "Ticket numbers are 13 digits.";
  return null;
}

export function emailError(v: string): string | null {
  if (!v.trim()) return "Enter your email.";
  if (v.length > 200 || !EMAIL_RE.test(v.trim())) return "Enter a valid email.";
  return null;
}

export function fairAmountError(v: number): string | null {
  if (!Number.isFinite(v) || v < 0 || v > MAX_FAIR_AMOUNT) return `Enter a number from 0 to ${MAX_FAIR_AMOUNT}.`;
  return null;
}
