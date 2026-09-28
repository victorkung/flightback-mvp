"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink, Button, ErrorText, Loading, Muted, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import { MAX_FAIR_AMOUNT } from "@/lib/constants";
import { fairAmountError } from "@/lib/validation";

export default function Fair() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  if (!ok) return <Loading />;

  const success = state.feeModel === "success";
  const value = state.fairAmount;

  function next(e: React.FormEvent) {
    e.preventDefault();
    const err = value.trim() === "" ? `Enter a number from 0 to ${MAX_FAIR_AMOUNT}.` : fairAmountError(Number(value));
    setError(err);
    if (!err) router.push("/offer");
  }

  return (
    <form onSubmit={next} noValidate className="space-y-6">
      <BackLink href="/fee" />
      <div className="space-y-2">
        <Title>{success ? "What percentage feels fair?" : "What monthly price feels fair?"}</Title>
        <Muted>
          {success
            ? "The share of your payout you'd be comfortable paying us, from 0 to 50 percent."
            : "What you'd be comfortable paying each month, from $0 to $50."}
        </Muted>
      </div>
      <div>
        <label htmlFor="fair" className="sr-only">
          {success ? "Percentage" : "Monthly price in dollars"}
        </label>
        <div
          className={`flex min-h-20 items-center gap-2 rounded-2xl border-2 bg-card px-5 focus-within:border-accent ${error ? "border-error" : "border-transparent"}`}
        >
          {!success && <span className="text-[34px] font-bold text-muted">$</span>}
          <input
            id="fair"
            type="number"
            inputMode="decimal"
            min={0}
            max={MAX_FAIR_AMOUNT}
            step="any"
            autoFocus
            value={value}
            aria-invalid={!!error || undefined}
            onChange={(e) => {
              setError(null);
              update({ fairAmount: e.target.value, offerAccepted: false });
            }}
            className="w-full bg-transparent text-[34px] font-bold outline-none"
          />
          <span className="shrink-0 text-xl font-semibold text-muted">{success ? "%" : "a month"}</span>
        </div>
        <ErrorText>{error}</ErrorText>
      </div>
      <Button type="submit">Continue</Button>
    </form>
  );
}
