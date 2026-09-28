"use client";

import { usePathname } from "next/navigation";
import { STEPS, stepOf } from "@/lib/flow";

export function Progress() {
  const step = stepOf(usePathname());
  const total = STEPS.length;
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        Step {step} of {total}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={`Step ${step} of ${total}`}
      >
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}
