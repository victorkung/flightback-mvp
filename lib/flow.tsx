"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { CheckResult, ClaimDetails, FeeModel, StripeSetup } from "./types";
import { codeError, emailError, fairAmountError, nameError, ticketError } from "./validation";

export type FlowState = {
  flightNumber: string;
  date: string;
  result: CheckResult | null;
  passengers: number;
  details: ClaimDetails;
  feeModel: FeeModel | "";
  fairAmount: string;
  offerAccepted: boolean;
  setup: (StripeSetup & { email: string }) | null;
  done: { claimId: string; passengers: number } | null;
};

const initial: FlowState = {
  flightNumber: "",
  date: "",
  result: null,
  passengers: 1,
  details: { confirmationCode: "", names: [""], tickets: [""], payout: "", email: "" },
  feeModel: "",
  fairAmount: "",
  offerAccepted: false,
  setup: null,
  done: null,
};

// The claim flow. The landing page at / sits outside it.
export const STEPS = ["/flight", "/result", "/details", "/fee", "/fair", "/offer", "/card", "/done"] as const;
const LAST = STEPS.length;
export const stepOf = (path: string) => Math.max(0, STEPS.indexOf(path as (typeof STEPS)[number])) + 1;

export const detailsValid = (s: FlowState) =>
  !codeError(s.details.confirmationCode) &&
  !emailError(s.details.email) &&
  !!s.details.payout &&
  s.details.names.length === s.passengers &&
  s.details.names.every((n) => !nameError(n)) &&
  s.details.tickets.every((t) => !ticketError(t));

/** The furthest step this state has earned. Pages beyond it redirect back. */
function reachable(s: FlowState): number {
  if (s.done) return 8;
  if (!s.result) return 1;
  if (!s.result.eligible) return 2;
  if (!detailsValid(s)) return 3;
  if (!s.feeModel) return 4;
  if (s.fairAmount === "" || fairAmountError(Number(s.fairAmount))) return 5;
  if (!s.offerAccepted) return 6;
  return 7;
}

const KEY = "flightback-flow-v1";

type Ctx = {
  state: FlowState;
  ready: boolean;
  update: (patch: Partial<FlowState> | ((s: FlowState) => Partial<FlowState>)) => void;
  reset: () => void;
};

const FlowContext = createContext<Ctx | null>(null);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlowState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once on mount
      if (saved) setState({ ...initial, ...JSON.parse(saved) });
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  const update = useCallback<Ctx["update"]>((patch) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);
  const reset = useCallback(() => setState(initial), []);

  return <FlowContext.Provider value={{ state, ready, update, reset }}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow outside FlowProvider");
  return ctx;
}

/** Sends the visitor back to the first step they still need to finish. Returns true when the page may render. */
export function useStepGuard(): boolean {
  const { state, ready } = useFlow();
  const router = useRouter();
  const path = usePathname();
  const step = stepOf(path);
  const max = reachable(state);
  // After finishing, the earlier steps are closed so the claim is not filed twice.
  const allowed = state.done ? step === LAST : step <= max;

  useEffect(() => {
    if (ready && !allowed) router.replace(STEPS[(state.done ? LAST : max) - 1]);
  }, [ready, allowed, max, router, state.done]);

  return ready && allowed;
}
