"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink, Button, ErrorText, Field, Loading, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { dateError, flightNumberError, normalizeFlightNumber } from "@/lib/validation";
import type { CheckResult } from "@/lib/types";

const localYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function AddFlight() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  const [flightNumber, setFlightNumber] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ flight?: string | null; date?: string | null; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const lastClick = useRef(0);

  if (!ok) return <Loading />;

  // Local edits win; otherwise show what is saved in the flow.
  const fn = flightNumber ?? state.flightNumber;
  const dt = date ?? state.date;
  const now = new Date();
  const max = localYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const min = localYmd(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Debounce: lookups are scarce, so ignore rapid repeat clicks.
    if (loading || Date.now() - lastClick.current < 1500) return;
    lastClick.current = Date.now();

    const next = { flight: flightNumberError(fn), date: dateError(dt) };
    setErrors(next);
    if (next.flight || next.date) return;

    const normalized = normalizeFlightNumber(fn);
    // Same flight as last time: reuse the answer instead of spending another lookup.
    if (state.result && state.flightNumber === normalized && state.date === dt) {
      router.push("/result");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/check-flight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightNumber: normalized, date: dt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ form: data.error ?? "We couldn't check flights right now. Try again in a minute." });
        return;
      }
      update({
        flightNumber: normalized,
        date: dt,
        result: data as CheckResult,
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
    <form onSubmit={submit} noValidate className="space-y-6">
      <BackLink href="/" />
      <div className="space-y-2">
        <Title>Add your flight</Title>
        <p className="text-muted">Enter the flight that brought you to your final destination.</p>
      </div>
      <div className="space-y-5">
        <Field
          label="Flight number"
          placeholder="AA 2256"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={8}
          value={fn}
          onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
          error={errors.flight}
        />
        <Field
          label="Date"
          type="date"
          min={min}
          max={max}
          value={dt}
          onChange={(e) => setDate(e.target.value)}
          help="The date your flight took off, in local time."
          error={errors.date}
        />
      </div>
      <ErrorText>{errors.form}</ErrorText>
      <Button type="submit" loading={loading}>
        {loading ? "Checking your flight" : "Check my flight"}
      </Button>
    </form>
  );
}
