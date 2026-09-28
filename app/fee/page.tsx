"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink, Button, Choice, ErrorText, Loading, Muted, Title } from "@/components/ui";
import { useFlow, useStepGuard } from "@/lib/flow";
import type { FeeModel } from "@/lib/types";

export default function Fee() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  const [error, setError] = useState("");
  if (!ok) return <Loading />;

  function choose(v: string) {
    setError("");
    // The fair amount means something different for each model, so clear it on change.
    if (v !== state.feeModel) update({ feeModel: v as FeeModel, fairAmount: "", offerAccepted: false });
  }

  function next() {
    if (!state.feeModel) return setError("Choose one to continue.");
    router.push("/fair");
  }

  return (
    <div className="space-y-6">
      <BackLink href="/details" />
      <div className="space-y-2">
        <Title>Which way of paying us feels fair?</Title>
        <Muted>There is no wrong answer. This helps us set a fair price.</Muted>
      </div>
      <fieldset className="space-y-2">
        <legend className="sr-only">Fee model</legend>
        <Choice name="fee" value="success" checked={state.feeModel === "success"} onChange={choose}>
          A success fee, only if I get paid
        </Choice>
        <Choice name="fee" value="monthly" checked={state.feeModel === "monthly"} onChange={choose}>
          A flat monthly plan
        </Choice>
        <ErrorText>{error}</ErrorText>
      </fieldset>
      <Button onClick={next}>Continue</Button>
    </div>
  );
}
