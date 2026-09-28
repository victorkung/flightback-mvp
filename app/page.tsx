"use client";

import { useRouter } from "next/navigation";
import { Button, Muted } from "@/components/ui";
import { useFlow } from "@/lib/flow";

export default function Landing() {
  const { state, reset } = useFlow();
  const router = useRouter();

  function start() {
    if (state.done) reset();
    router.push("/flight");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-[32px] font-bold leading-[1.15] tracking-tight">
          Your flight was 3+ hours late. You may be owed $250 per passenger.
        </h1>
        <Muted className="text-lg">We check your flight, file the claim, and only get paid if you do.</Muted>
      </div>
      <Button onClick={start}>Check my flight</Button>
      <ul className="space-y-3 border-t border-line pt-6 text-sm text-muted">
        <li>Covers US domestic flights that reached their final destination 3 or more hours late.</li>
        <li>Checking your flight is free and takes about a minute.</li>
        <li>We tell you our fee before you add a card.</li>
      </ul>
    </div>
  );
}
