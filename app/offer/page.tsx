"use client";

import { useRouter } from "next/navigation";
import { BackLink, Button, Card, Loading, Muted, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { OFFER_PCT, feeFor, owedFor } from "@/lib/constants";
import { formatUsd } from "@/lib/format";

export default function Offer() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  if (!ok) return <Loading />;

  const owed = owedFor(state.passengers);
  const fee = feeFor(state.passengers);

  function accept() {
    update({ offerAccepted: true });
    router.push("/card");
  }

  return (
    <div className="space-y-6">
      <BackLink href="/fair" />
      <Title>
        We&apos;ll file for {OFFER_PCT}% of what you receive, charged only after the airline pays you.
      </Title>

      <Card>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted">You&apos;re likely owed</dt>
            <dd className="font-semibold">{formatUsd(owed)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Our fee, {OFFER_PCT}%</dt>
            <dd className="font-semibold">{formatUsd(fee)}</dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-line pt-4 font-semibold">
          {formatUsd(fee)} on {formatUsd(owed)}
        </p>
        <Muted className="mt-1 text-sm">If the airline doesn&apos;t pay, you pay nothing.</Muted>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold">What happens next</h2>
        <ol className="space-y-3">
          {[
            "We file with the airline through its official claims channel.",
            "We send you updates by email.",
            "The airline pays you directly. We charge our fee after that.",
          ].map((t, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-line text-sm font-semibold">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <Button onClick={accept}>Accept and add a card</Button>
    </div>
  );
}
