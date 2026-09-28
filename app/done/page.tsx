"use client";

import { useRouter } from "next/navigation";
import { Card, Loading, Muted, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { OFFER_PCT, feeFor, owedFor } from "@/lib/constants";
import { formatUsd } from "@/lib/format";

export default function Done() {
  const ok = useStepGuard();
  const { state, reset } = useFlow();
  const router = useRouter();
  if (!ok || !state.done) return <Loading />;

  const { claimId, passengers } = state.done;
  const owed = owedFor(passengers);
  const steps = [
    { when: "Today", what: "We file your claim with the airline." },
    { when: "Within 30 days", what: "The airline responds. We email you when it does." },
    { when: "Then", what: `The airline pays you ${formatUsd(owed)} directly.` },
    { when: "After you're paid", what: `We charge our ${OFFER_PCT}% fee of ${formatUsd(feeFor(passengers))}.` },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Title>We&apos;ve got it. Your {formatUsd(owed)} claim is in.</Title>
        <Muted>
          Your claim ID is <span className="font-semibold text-ink">{claimId}</span>. Keep it for your records.
        </Muted>
      </div>

      <Card>
        <ol className="relative space-y-5 border-l-2 border-line pl-5">
          {steps.map((s, i) => (
            <li key={s.when} className="relative">
              <span
                className={`absolute -left-[27px] top-1 size-3 rounded-full ${i === 0 ? "bg-accent" : "border-2 border-line bg-card"}`}
              />
              <p className="text-sm font-semibold">{s.when}</p>
              <p className="text-muted">{s.what}</p>
            </li>
          ))}
        </ol>
      </Card>

      <button
        type="button"
        onClick={() => {
          reset();
          router.push("/flight");
        }}
        className="min-h-11 text-sm font-medium text-muted underline underline-offset-4 hover:text-ink"
      >
        Check another flight
      </button>
    </div>
  );
}
