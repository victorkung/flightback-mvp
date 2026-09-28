"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackLink, Button, Card, Choice, ErrorText, Field, Loading, Muted, Title } from "@/components/ui";
import { detailsValid, useFlow, useStepGuard } from "@/lib/flow";
import { codeError, emailError, nameError, normalizeCode, normalizeTicket, ticketError } from "@/lib/validation";
import type { ClaimDetails, Payout } from "@/lib/types";

export default function Details() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);
  if (!ok) return <Loading />;

  const d = state.details;
  const set = (patch: Partial<ClaimDetails>) => update((s) => ({ details: { ...s.details, ...patch } }));
  const setAt = (key: "names" | "tickets", i: number, v: string) =>
    update((s) => ({ details: { ...s.details, [key]: s.details[key].map((x, j) => (j === i ? v : x)) } }));
  const err = <T,>(fn: (v: T) => string | null, v: T) => (showErrors ? fn(v) : null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Store the cleaned-up forms so the server sees exactly what passed here.
    const cleaned: ClaimDetails = {
      ...d,
      confirmationCode: normalizeCode(d.confirmationCode),
      names: d.names.map((n) => n.trim().replace(/\s+/g, " ")),
      tickets: d.tickets.map(normalizeTicket),
      email: d.email.trim(),
    };
    update({ details: cleaned });
    if (!detailsValid({ ...state, details: cleaned })) {
      setShowErrors(true);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    router.push("/fee");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <BackLink href="/result" />
      <div className="space-y-2">
        <Title>Claim details</Title>
        <Muted>The airline needs these to match your booking. You&apos;ll find them in your confirmation email.</Muted>
      </div>

      <Field
        label="Confirmation code"
        placeholder="ABC123"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={6}
        value={d.confirmationCode}
        onChange={(e) => set({ confirmationCode: e.target.value.toUpperCase() })}
        help="6 letters or numbers."
        error={err(codeError, d.confirmationCode)}
      />

      {d.names.map((name, i) => (
        <Card key={i} className="space-y-4">
          <p className="font-semibold">{d.names.length > 1 ? `Passenger ${i + 1}` : "Passenger"}</p>
          <Field
            label="Full name"
            autoComplete={i === 0 ? "name" : "off"}
            value={name}
            onChange={(e) => setAt("names", i, e.target.value)}
            help={i === 0 ? "As shown on the ticket." : undefined}
            error={err(nameError, name)}
          />
          <Field
            label="Ticket number"
            inputMode="numeric"
            autoComplete="off"
            maxLength={17}
            value={d.tickets[i] ?? ""}
            onChange={(e) => setAt("tickets", i, e.target.value.replace(/[^\d\s-]/g, ""))}
            help="13 digits, usually starting with the airline's code. Find it in your confirmation email."
            error={err(ticketError, d.tickets[i] ?? "")}
          />
        </Card>
      ))}

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-semibold">How would you like to be paid</legend>
        <Choice name="payout" value="cash" checked={d.payout === "cash"} onChange={(v) => set({ payout: v as Payout })}>
          Cash
        </Choice>
        <Choice
          name="payout"
          value="credit"
          checked={d.payout === "credit"}
          onChange={(v) => set({ payout: v as Payout })}
        >
          Travel credit
        </Choice>
        <ErrorText>{showErrors && !d.payout ? "Choose how you'd like to be paid." : null}</ErrorText>
      </fieldset>

      <Field
        label="Email for updates"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={d.email}
        onChange={(e) => set({ email: e.target.value })}
        help="We only use this to send updates about your claim."
        error={err(emailError, d.email)}
      />

      <Button type="submit">Continue</Button>
    </form>
  );
}
