"use client";

import { useRouter } from "next/navigation";
import { Button, Check, Group, MarkTile, Muted, Row } from "@/components/ui";
import { useFlow } from "@/lib/flow";

export default function Landing() {
  const { state, reset } = useFlow();
  const router = useRouter();

  function start() {
    if (state.done) reset();
    router.push("/flight");
  }

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <MarkTile />
        <h1 className="text-[32px] font-bold leading-[1.12] tracking-tight">
          Your flight was 3+ hours late. You may be owed $250 per passenger.
        </h1>
        <Muted className="text-lg">We check your flight, file the claim, and only get paid if you do.</Muted>
      </div>
      <Group>
        <Row label="US domestic flights, 3 or more hours late" value={<Check />} />
        <Row label="Checking your flight is free" value={<Check />} />
        <Row label="Our fee is shown before you add a card" value={<Check />} />
      </Group>
      <Button onClick={start}>Check my flight</Button>
    </div>
  );
}
