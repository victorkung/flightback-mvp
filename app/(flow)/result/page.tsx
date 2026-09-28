"use client";

import { useRouter } from "next/navigation";
import { BackLink, Button, Group, Loading, MarkTile, Muted, Row, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { AMOUNT_PER_PASSENGER, MAX_PASSENGERS, owedFor } from "@/lib/constants";
import { formatDate, formatDuration, formatTime, formatUsd } from "@/lib/format";
import type { FlightArrival } from "@/lib/types";

function FlightRows({ flight, children }: { flight: FlightArrival; children?: React.ReactNode }) {
  return (
    <Group>
      <Row
        label={`${flight.origin.city || flight.origin.iata} to ${flight.destination.city || flight.destination.iata}`}
        sub={[flight.airline, flight.flightNumber, formatDate(flight.date)].filter(Boolean).join(" · ")}
        strong
      />
      {flight.actualArrivalUtc && (
        <>
          <Row label={<span className="text-muted">Original arrival</span>} value={formatTime(flight.scheduledArrivalUtc, flight.date)} />
          <Row
            label={<span className="text-muted">Actual arrival, {flight.destination.iata}</span>}
            value={formatTime(flight.actualArrivalUtc, flight.date)}
          />
        </>
      )}
      {children}
    </Group>
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
        {result.flight && <FlightRows flight={result.flight} />}
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

  const stepBtn =
    "flex size-11 items-center justify-center rounded-full bg-accent-soft text-2xl font-medium text-accent disabled:opacity-40";

  return (
    <div className="space-y-6">
      <BackLink href="/flight" />
      <div className="space-y-4">
        <MarkTile />
        <Title>Your flight arrived {formatDuration(flight.delayMinutes!)} late.</Title>
      </div>

      <FlightRows flight={flight}>
        <Row label={<span className="text-muted">Rule</span>} value="3h or more late" />
      </FlightRows>

      <Group>
        <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-3">
          <label htmlFor="pax" className="font-semibold">
            Passengers on this booking
          </label>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Fewer passengers" onClick={() => setPassengers(n - 1)} disabled={n <= 1} className={stepBtn}>
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
              className="h-11 w-10 bg-transparent text-center text-xl font-semibold outline-none"
            />
            <button
              type="button"
              aria-label="More passengers"
              onClick={() => setPassengers(n + 1)}
              disabled={n >= MAX_PASSENGERS}
              className={stepBtn}
            >
              +
            </button>
          </div>
        </div>
      </Group>

      <div aria-live="polite">
        <p className="text-[28px] font-bold leading-tight tracking-tight">You&apos;re likely owed</p>
        <p className="text-[64px] font-bold leading-none tracking-tight text-accent">{formatUsd(owedFor(n))}</p>
        <Muted className="mt-2 text-lg">
          {formatUsd(AMOUNT_PER_PASSENGER)} × {n} {n === 1 ? "passenger" : "passengers"}. The airline makes the final
          decision.
        </Muted>
      </div>

      <Button onClick={() => router.push("/details")}>Continue</Button>
    </div>
  );
}
