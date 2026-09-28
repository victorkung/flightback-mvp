"use client";

import { useRouter } from "next/navigation";
import { Card, Loading, Muted, TextButton, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { OFFER_PCT, feeFor, owedFor } from "@/lib/constants";
import { airlineName, formatUsd } from "@/lib/format";

export default function Done() {
  const ok = useStepGuard();
  const { state, reset } = useFlow();
  const router = useRouter();
  if (!ok || !state.done) return <Loading />;

  const { claimId, passengers } = state.done;
  const flight = state.result?.eligible ? state.result.flight : null;
  const airline = flight ? airlineName(flight) : "The airline";
  const owed = owedFor(passengers);
  const steps = [
    { title: "Filed", when: "Today" },
    { title: `${airline.charAt(0).toUpperCase()}${airline.slice(1)} responds`, when: "Within 30 days" },
    { title: `You're paid ${formatUsd(owed)}`, when: "By the airline, directly" },
    { title: `Our ${OFFER_PCT}% fee, ${formatUsd(feeFor(passengers))}`, when: "Only after you're paid" },
  ];

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        {flight && (
          <Muted>
            {[flight.airline, `${flight.origin.iata} to ${flight.destination.iata}`, state.details.confirmationCode]
              .filter(Boolean)
              .join(" · ")}
          </Muted>
        )}
        <Title>We&apos;ve got it. Your {formatUsd(owed)} claim is in.</Title>
        <Muted>
          Claim ID <span className="font-semibold text-ink">{claimId}</span>. Keep it for your records.
        </Muted>
      </div>

      <Card>
        <ol>
          {steps.map((s, i) => {
            const first = i === 0;
            const last = i === steps.length - 1;
            return (
              <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && (
                  <span className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${first ? "bg-accent" : "bg-line"}`} aria-hidden />
                )}
                <span
                  className={`relative flex size-7 shrink-0 items-center justify-center rounded-full ${first ? "bg-accent text-white" : "border-2 border-line bg-card"}`}
                  aria-hidden
                >
                  {first && (
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.6">
                      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <div>
                  <p className={`text-[17px] font-semibold ${first ? "" : "text-muted"}`}>{s.title}</p>
                  <p className={first ? "text-accent" : "text-muted"}>{s.when}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <Muted className="px-1 text-sm">Updates will arrive at {state.details.email}.</Muted>

      <TextButton
        onClick={() => {
          reset();
          router.push("/flight");
        }}
      >
        Check another flight
      </TextButton>
    </div>
  );
}
