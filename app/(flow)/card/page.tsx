"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { BackLink, Button, Card, ErrorText, Loading, Muted, SectionLabel, Title } from "@/components/ui";
import { useFlow, useStepGuard, type FlowState } from "@/lib/flow";
import { OFFER_PCT, feeFor, owedFor } from "@/lib/constants";
import { formatUsd } from "@/lib/format";
import type { SubmitPayload } from "@/lib/types";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
// Test mode only. A live key is ignored so this page can never collect a real card.
const stripePromise = pk.startsWith("pk_test_") ? loadStripe(pk) : null;

const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#0072D0",
    colorText: "#111418",
    colorTextSecondary: "#6B7079",
    colorDanger: "#C62828",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
    fontSizeBase: "16px",
  },
  rules: { ".Input": { borderColor: "#E6E8EB", boxShadow: "none", padding: "14px" } },
};

export default function CardStep() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const started = useRef(false);

  const email = state.details.email;
  const setup = state.setup?.email === email ? state.setup : null;

  useEffect(() => {
    if (!ok || setup || started.current || !stripePromise) return;
    started.current = true;
    fetch("/api/setup-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: state.details.names[0] }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.clientSecret) throw new Error(data.error);
        update({ setup: { clientSecret: data.clientSecret, customerId: data.customerId, claimId: data.claimId, email } });
      })
      .catch((e: Error) => {
        started.current = false;
        setError(e.message || "We couldn't start the card step. Try again in a minute.");
      });
  }, [ok, setup, email, state.details.names, update, attempt]);

  if (!ok) return <Loading />;

  return (
    <div className="space-y-7">
      <BackLink href="/offer" />
      <div className="space-y-1">
        <Title>Save a card</Title>
        <Muted>
          We charge {formatUsd(feeFor(state.passengers))}, which is {OFFER_PCT}% of {formatUsd(owedFor(state.passengers))},
          only after the airline pays you.
        </Muted>
      </div>

      {!stripePromise ? (
        <ErrorText>Card saving is not set up on this site yet.</ErrorText>
      ) : setup ? (
        <Elements
          key={setup.clientSecret}
          stripe={stripePromise}
          options={{
            clientSecret: setup.clientSecret,
            appearance,
            fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" }],
          }}
        >
          <CardForm />
        </Elements>
      ) : error ? (
        <div className="space-y-4">
          <ErrorText>{error}</ErrorText>
          <Button
            onClick={() => {
              setError("");
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <Loading />
      )}
    </div>
  );
}

function payloadFrom(s: FlowState, paymentMethodId: string, setupIntentId: string): SubmitPayload | null {
  if (!s.result?.eligible || !s.setup || !s.feeModel || !s.details.payout) return null;
  return {
    claimId: s.setup.claimId,
    flight: s.result.flight,
    passengers: s.passengers,
    details: s.details,
    feeModel: s.feeModel,
    fairAmount: Number(s.fairAmount),
    stripe: { customerId: s.setup.customerId, paymentMethodId, setupIntentId },
    permission: true,
  };
}

function CardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { state, update } = useFlow();
  const router = useRouter();
  const [permission, setPermission] = useState(false);
  const [complete, setComplete] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [permError, setPermError] = useState("");
  // Once the card is saved we keep these, so a failed submit can be retried without re-confirming.
  const [saved, setSaved] = useState<{ paymentMethodId: string; setupIntentId: string } | null>(null);

  const single = state.passengers === 1;

  async function submitClaim(card: { paymentMethodId: string; setupIntentId: string }) {
    const payload = payloadFrom(state, card.paymentMethodId, card.setupIntentId);
    if (!payload) throw new Error("Some claim details are missing. Go back and check them.");
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Your card is saved, but we couldn't send your claim. Try again.");
    update({ done: { claimId: payload.claimId, passengers: payload.passengers } });
    router.push("/done");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    if (!permission) {
      setPermError("Please confirm before continuing.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let card = saved;
      if (!card) {
        const { error: err, setupIntent } = await stripe.confirmSetup({
          elements,
          redirect: "if_required",
          confirmParams: { return_url: `${window.location.origin}/card` },
        });
        // A refresh after saving can leave the intent already succeeded. Treat that as saved.
        const si = setupIntent ?? (err?.setup_intent?.status === "succeeded" ? err.setup_intent : null);
        if (!si || si.status !== "succeeded") {
          setError(err?.message ?? "We couldn't save your card. Check the details and try again.");
          return;
        }
        const pm = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
        if (!pm) {
          setError("We couldn't save your card. Try again.");
          return;
        }
        card = { paymentMethodId: pm, setupIntentId: si.id };
        setSaved(card);
      }
      await submitClaim(card);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <section>
        <SectionLabel>Payment method</SectionLabel>
        <p className="mb-3 px-1 font-semibold">Nothing is charged today.</p>
        <Card className="relative min-h-40">
          {!elementReady && (
            <div className="absolute inset-0">
              <Loading />
            </div>
          )}
          {/* Link off: it adds a pay-by-bank tab with promos, which does not belong on a card step. */}
          <PaymentElement
            options={{ layout: "tabs", wallets: { link: "never" } }}
            onReady={() => setElementReady(true)}
            onChange={(e) => setComplete(e.complete)}
          />
        </Card>
        <p className="mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-dark">
          Test mode: use 4242 4242 4242 4242, any future date, any CVC.
        </p>
      </section>

      <div>
        <label className="flex cursor-pointer items-start gap-3 px-1 text-[17px]">
          <input
            type="checkbox"
            required
            checked={permission}
            onChange={(e) => {
              setPermission(e.target.checked);
              setPermError("");
            }}
            aria-invalid={!!permError || undefined}
            className="mt-0.5 size-6 shrink-0 accent-accent"
          />
          <span>
            {single
              ? "I'm the passenger on this booking, or I have their permission to file."
              : "I have permission to file for the other passengers on this booking."}
          </span>
        </label>
        <ErrorText>{permError}</ErrorText>
      </div>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" loading={busy} disabled={!stripe || (!complete && !saved)}>
        {busy ? "Saving your card" : "Authorize and file"}
      </Button>
    </form>
  );
}
