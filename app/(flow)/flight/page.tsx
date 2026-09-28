"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink, Button, Choice, ErrorText, Field, Loading, SectionLabel, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { AIRLINES } from "@/lib/airlines";
import { formatTime } from "@/lib/format";
import { airlineError, dateError, flightDigitsError, normalizeFlightDigits } from "@/lib/validation";
import type { Airport, CheckResponse, RouteOption } from "@/lib/types";

const localYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const place = (a: Airport) => (a.city ? `${a.city} (${a.iata})` : a.iata);

// Through trips first within the same departure, since that is how most people fly them.
const byDeparture = (a: RouteOption, b: RouteOption) =>
  (a.scheduledDepartureUtc ?? "").localeCompare(b.scheduledDepartureUtc ?? "") || b.via.length - a.via.length;

type Errors = { airline?: string | null; digits?: string | null; date?: string | null; route?: string; form?: string };

export default function AddFlight() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  const airlineId = useId();
  const [airline, setAirline] = useState<string | null>(null);
  const [digits, setDigits] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [options, setOptions] = useState<RouteOption[] | null>(null);
  const [route, setRoute] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const lastClick = useRef(0);

  if (!ok) return <Loading />;

  // Local edits win; until then, show what is saved in the flow ("AA 1062").
  const [savedCode = "", savedNum = ""] = state.flightNumber.split(" ");
  const code = airline ?? savedCode;
  const num = digits ?? savedNum;
  const dt = date ?? state.date;
  const rt = route ?? state.route;
  const now = new Date();
  const max = localYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const min = localYmd(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

  // Any change to the flight means the trip list no longer applies.
  function edited() {
    setOptions(null);
    setRoute("");
    setErrors({});
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Debounce: lookups are scarce, so ignore rapid repeat clicks.
    if (loading || Date.now() - lastClick.current < 1500) return;
    lastClick.current = Date.now();

    const next: Errors = { airline: airlineError(code), digits: flightDigitsError(num), date: dateError(dt) };
    if (options && !rt) next.route = "Choose the trip you took.";
    setErrors(next);
    if (next.airline || next.digits || next.date || next.route) return;

    const flightNumber = `${code} ${normalizeFlightDigits(num)}`;
    // Same flight as last time: reuse the answer instead of spending another lookup.
    if (state.result && state.flightNumber === flightNumber && state.date === dt && state.route === rt) {
      router.push("/result");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/check-flight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNumber, date: dt, route: rt || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as CheckResponse & { error?: string };
      if (!res.ok) {
        setErrors({ form: data.error ?? "We couldn't check flights right now. Try again in a minute." });
        return;
      }
      if ("chooseRoute" in data) {
        setOptions([...data.options].sort(byDeparture));
        return;
      }
      update({
        flightNumber,
        date: dt,
        route: rt,
        result: data,
        // A new flight starts the rest of the flow fresh.
        offerAccepted: false,
        setup: null,
      });
      router.push("/result");
    } catch {
      setErrors({ form: "We couldn't check flights right now. Try again in a minute." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-7">
      <BackLink href="/" />
      <div className="space-y-1">
        <Title>Add your flight</Title>
        <p className="text-muted">Enter the flight that brought you to your final destination.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor={airlineId}
            className="mb-2 block px-1 text-[13px] font-semibold uppercase tracking-wide text-muted"
          >
            Airline
          </label>
          <div className="relative">
            <select
              id={airlineId}
              value={code}
              aria-invalid={!!errors.airline || undefined}
              onChange={(e) => {
                setAirline(e.target.value);
                edited();
              }}
              className={`min-h-14 w-full appearance-none rounded-2xl border-2 bg-card pl-4 pr-11 text-[17px] outline-none transition focus:border-accent ${errors.airline ? "border-error" : "border-transparent"} ${code ? "" : "text-muted/70"}`}
            >
              <option value="" disabled>
                Choose your airline
              </option>
              {AIRLINES.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <ErrorText>{errors.airline}</ErrorText>
        </div>

        <div className="relative">
          <Field
            label="Flight number"
            placeholder="1062"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={num}
            onChange={(e) => {
              setDigits(e.target.value.replace(/\D/g, ""));
              edited();
            }}
            help="Just the numbers. You'll find them on your boarding pass or confirmation email."
            error={errors.digits}
            className="pl-14"
          />
          {/* The airline code sits in front of the number, the way it reads on a ticket. */}
          <span
            className={`pointer-events-none absolute left-4 top-[42px] text-[17px] font-semibold ${code ? "text-ink" : "text-muted/50"}`}
            aria-hidden
          >
            {code || "--"}
          </span>
        </div>

        <Field
          label="Date"
          type="date"
          min={min}
          max={max}
          value={dt}
          onChange={(e) => {
            setDate(e.target.value);
            edited();
          }}
          help="The date your flight took off, in local time."
          error={errors.date}
        />
      </div>

      {options && (
        <fieldset className="space-y-2">
          <SectionLabel as="legend">Which trip did you take?</SectionLabel>
          <p className="px-1 pb-1 text-muted">
            {code} {normalizeFlightDigits(num)} made more than one trip that day. Choose the one you were on, from where
            you got on to where you got off.
          </p>
          {options.map((o) => (
            <Choice key={o.route} name="route" value={o.route} checked={rt === o.route} onChange={setRoute}>
              <span className="block">
                {place(o.origin)} to {place(o.destination)}
              </span>
              <span className="block text-sm text-muted">
                {o.via.length ? `Via ${o.via.map((v) => v.city || v.iata).join(", ")}` : "Nonstop"}
                {o.scheduledDepartureUtc && ` · departs ${formatTime(o.scheduledDepartureUtc, dt)}`}
              </span>
            </Choice>
          ))}
          <ErrorText>{errors.route}</ErrorText>
        </fieldset>
      )}

      <ErrorText>{errors.form}</ErrorText>
      <Button type="submit" loading={loading}>
        {loading ? "Checking your flight" : "Check my flight"}
      </Button>
    </form>
  );
}
