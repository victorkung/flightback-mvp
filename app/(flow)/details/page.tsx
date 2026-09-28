"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BackLink,
  Button,
  Check,
  ErrorText,
  Field,
  Group,
  GroupField,
  Loading,
  Row,
  SectionLabel,
  Segmented,
  Title,
} from "@/components/ui";
import { detailsValid, useFlow, useStepGuard } from "@/lib/flow";
import { airlineName, formatDate } from "@/lib/format";
import { codeError, emailError, nameError, normalizeCode, normalizeTicket, ticketError } from "@/lib/validation";
import type { ClaimDetails, Payout } from "@/lib/types";

export default function Details() {
  const ok = useStepGuard();
  const { state, update } = useFlow();
  const router = useRouter();
  const [showErrors, setShowErrors] = useState(false);
  if (!ok || !state.result?.eligible) return <Loading />;

  const flight = state.result.flight;
  const airline = airlineName(flight);
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
    <form onSubmit={submit} noValidate className="space-y-7">
      <BackLink href="/result" />
      <div className="space-y-1">
        <Title>Claim details</Title>
        <p className="text-muted">{airline.charAt(0).toUpperCase() + airline.slice(1)} needs these to match your booking. You&apos;ll find them in your confirmation email.</p>
      </div>

      <section>
        <SectionLabel>Your trip</SectionLabel>
        <Group>
          <Row label={`${formatDate(flight.date)} · ${flight.origin.iata} to ${flight.destination.iata}`} value={<Check />} />
          <Row label={flight.flightNumber} value={<Check />} />
        </Group>
      </section>

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
        <section key={i}>
          <SectionLabel>{d.names.length > 1 ? `Passenger ${i + 1}` : "Passenger"}</SectionLabel>
          <Group>
            <GroupField
              label="Full name, as on the ticket"
              autoComplete={i === 0 ? "name" : "off"}
              value={name}
              onChange={(e) => setAt("names", i, e.target.value)}
              error={err(nameError, name)}
            />
            <GroupField
              label="Ticket number"
              placeholder="001 2345 678901"
              inputMode="numeric"
              autoComplete="off"
              maxLength={17}
              value={d.tickets[i] ?? ""}
              onChange={(e) => setAt("tickets", i, e.target.value.replace(/[^\d\s-]/g, ""))}
              error={err(ticketError, d.tickets[i] ?? "")}
            />
          </Group>
        </section>
      ))}
      <p className="-mt-4 px-1 text-sm text-muted">
        13 digits, usually starting with the airline&apos;s code. Find it in your confirmation email.
      </p>

      <fieldset>
        <SectionLabel as="legend">How {airline} should pay you</SectionLabel>
        <Segmented<Payout>
          name="payout"
          value={d.payout}
          onChange={(v) => set({ payout: v })}
          options={[
            { value: "cash", label: "Cash" },
            { value: "credit", label: "Travel credit" },
          ]}
        />
        <ErrorText>{showErrors && !d.payout ? "Choose how you'd like to be paid." : null}</ErrorText>
      </fieldset>

      <Field
        label="Email for updates"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={d.email}
        onChange={(e) => set({ email: e.target.value })}
        help="We only use this to send updates about your claim."
        error={err(emailError, d.email)}
      />

      <Button type="submit">Continue</Button>
    </form>
  );
}
