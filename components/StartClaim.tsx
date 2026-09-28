"use client";

import { useRouter } from "next/navigation";
import { useFlow } from "@/lib/flow";

/** Starts the claim flow. Someone who already finished a claim starts fresh. */
export function StartClaim({ children, className }: { children: React.ReactNode; className: string }) {
  const { state, reset } = useFlow();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (state.done) reset();
        router.push("/flight");
      }}
    >
      {children}
    </button>
  );
}
