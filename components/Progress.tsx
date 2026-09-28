"use client";

import { usePathname } from "next/navigation";
import { STEPS, stepOf } from "@/lib/flow";

export function Progress() {
  const step = stepOf(usePathname());
  const total = STEPS.length;
  return (
    <div className="mb-5">
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={`Step ${step} of ${total}`}
      >
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1 flex-1 rounded-full ${i < step ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-2 text-[13px] text-muted" aria-hidden>
        Step {step} of {total}
      </p>
    </div>
  );
}
