"use client";

import { useRouter } from "next/navigation";
import { BackLink, Button, Card, Loading, Muted, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { MAX_PASSENGERS, owedFor } from "@/lib/constants";
import { formatDate, formatDuration, formatTime, formatUsd, routeLong } from "@/lib/format";
import type { FlightArrival } from "@/lib/types";

function FlightSummary({ flight, showTimes }: { flight: FlightArrival; showTimes: boolean }) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="font-semibold">
          {flight.flightNumber}
          {flight.airline && <span className="font-normal text-muted"> · {flight.airline}</span>}
        </p>
        <p className="text-muted">{routeLong(flight)}</p>
        <p className="text-sm text-muted">{formatDate(flight.date)}</p>
      </div>
      {showTimes && flight.actualArrivalUtc && (
        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-muted">Scheduled arrival</dt>
            <dd className="font-semibold">{formatTime(flight.scheduledArrivalUtc)}</dd>
          </div>
          <div>
            <dt className="text-muted">Actual arrival</dt>
            <dd className="font-semibold">{formatTime(flight.actualArrivalUtc)}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}

export default function Result() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  if (!ok || !state.result) return <Loading />;

  const result = state.result;

  if (!result.eligible) {
    return (
      <div className="space-y-6">
        <BackLink href="/flight" />
        <Title>We can&apos;t file for this flight</Title>
        <p className="text-lg">{result.reason}</p>
        {result.flight && <FlightSummary flight={result.flight} showTimes />}
        <Button onClick={() => router.push("/flight")}>Check another flight</Button>
      </div>
    );
  }

  const { flight } = result;
  const n = state.passengers;

  function setPassengers(next: number) {
    const count = Math.min(MAX_PASSENGERS, Math.max(1, next));
    update((s) => ({
      passengers: count,
      details: {
        ...s.details,
        names: Array.from({ length: count }, (_, i) => s.details.names[i] ?? ""),
        tickets: Array.from({ length: count }, (_, i) => s.details.tickets[i] ?? ""),
      },
    }));
  }

  return (
    <div className="space-y-6">
      <BackLink href="/flight" />
      <Title>Your flight arrived {formatDuration(flight.delayMinutes!)} late.</Title>
      <FlightSummary flight={flight} showTimes />

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="pax" className="font-semibold">
            Passengers on this booking
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Fewer passengers"
              onClick={() => setPassengers(n - 1)}
              disabled={n <= 1}
              className="size-11 rounded-xl border border-line bg-white text-xl font-semibold disabled:opacity-40"
            >
              −
            </button>
            <input
              id="pax"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_PASSENGERS}
              value={n}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v)) setPassengers(v);
              }}
              className="h-11 w-12 rounded-xl border border-line bg-white text-center text-lg font-semibold"
            />
            <button
              type="button"
              aria-label="More passengers"
              onClick={() => setPassengers(n + 1)}
              disabled={n >= MAX_PASSENGERS}
              className="size-11 rounded-xl border border-line bg-white text-xl font-semibold disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
        <div className="border-t border-line pt-4" aria-live="polite">
          <p className="text-2xl font-bold">You&apos;re likely owed {formatUsd(owedFor(n))}</p>
          <Muted className="text-sm">$250 for each passenger. The airline makes the final decision.</Muted>
        </div>
      </Card>

      <Button onClick={() => router.push("/details")}>Continue</Button>
    </div>
  );
}
