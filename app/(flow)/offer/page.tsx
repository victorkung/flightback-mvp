"use client";

import { useRouter } from "next/navigation";
import { BackLink, Button, Group, Loading, Muted, Row, SectionLabel, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { AMOUNT_PER_PASSENGER, OFFER_PCT, feeFor, owedFor } from "@/lib/constants";
import { airlineName, formatUsd } from "@/lib/format";

export default function Offer() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  if (!ok || !state.result?.eligible) return <Loading />;

  const airline = airlineName(state.result.flight);
  const owed = owedFor(state.passengers);
  const fee = feeFor(state.passengers);

  function accept() {
    update({ offerAccepted: true });
    router.push("/card");
  }

  return (
    <div className="space-y-7">
      <BackLink href="/fair" />
      <div className="space-y-1">
        <Title>
          We&apos;ll file for {OFFER_PCT}% of what you receive, charged only after the airline pays you.
        </Title>
        <Muted>Confirmation {state.details.confirmationCode}</Muted>
      </div>

      <section>
        <SectionLabel>Passengers</SectionLabel>
        <Group>
          {state.details.names.map((name, i) => (
            <Row key={i} label={name} value={formatUsd(AMOUNT_PER_PASSENGER)} />
          ))}
          <Row label="You're likely owed" value={formatUsd(owed)} strong />
        </Group>
      </section>

      <section>
        <SectionLabel>Our fee</SectionLabel>
        <div className="rounded-[20px] border-2 border-accent bg-card p-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-lg font-semibold">{OFFER_PCT}% of what you receive</p>
            <p className="text-2xl font-bold">{formatUsd(fee)}</p>
          </div>
          <p className="mt-1 text-muted">
            {formatUsd(fee)} on {formatUsd(owed)}. Charged only after {airline} pays you. If they don&apos;t pay, you
            pay nothing.
          </p>
        </div>
      </section>

      <section>
        <SectionLabel>What happens next</SectionLabel>
        <Group>
          {[
            "We file with the airline through its official claims channel.",
            "We send you updates by email.",
            "The airline pays you directly. We charge our fee after that.",
          ].map((t, i) => (
            <div key={i} className="flex gap-3 px-5 py-3.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <span>{t}</span>
            </div>
          ))}
        </Group>
      </section>

      <Button onClick={accept}>Accept and add a card</Button>
    </div>
  );
}
