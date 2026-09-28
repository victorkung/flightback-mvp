"use client";

import Image from "next/image";
import Link from "next/link";
import { useId } from "react";

const primary =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-[17px] font-semibold text-white transition hover:bg-accent-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50";

export function Button({
  loading,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button {...props} disabled={props.disabled || loading} aria-busy={loading || undefined} className={`${primary} ${className}`}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function TextButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="flex min-h-12 w-full items-center justify-center text-[17px] font-medium text-accent hover:text-accent-dark"
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[20px] bg-card p-5 ${className}`}>{children}</div>;
}

/** iOS-style grouped list: a white card whose children are divided rows. */
export function Group({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`divide-y divide-line overflow-hidden rounded-[20px] bg-card ${className}`}>{children}</div>;
}

export function Row({
  label,
  value,
  sub,
  strong,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <div className={strong ? "font-semibold" : ""}>{label}</div>
        {sub && <div className="text-sm text-muted">{sub}</div>}
      </div>
      {value !== undefined && <div className="shrink-0 text-right font-medium">{value}</div>}
    </div>
  );
}

export function Check() {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-ok-soft text-ok" aria-label="Confirmed">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function SectionLabel({ children, as: As = "h2" }: { children: React.ReactNode; as?: "h2" | "legend" | "p" }) {
  return <As className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</As>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight">{children}</h1>;
}

export function Muted({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-muted ${className}`}>{children}</p>;
}

export function MarkTile() {
  return (
    <div className="flex size-16 items-center justify-center rounded-2xl bg-accent-soft">
      <Image src="/mark.png" alt="" width={30} height={36} priority />
    </div>
  );
}

export function ErrorText({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 px-1 text-sm font-medium text-error">
      {children}
    </p>
  );
}

export function Field({
  label,
  help,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string; error?: string | null }) {
  const id = useId();
  const described = [help && `${id}-help`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={described}
        {...props}
        className={`min-h-14 w-full rounded-2xl border-2 bg-card px-4 text-[17px] outline-none transition placeholder:text-muted/60 focus:border-accent ${error ? "border-error" : "border-transparent"} ${props.className ?? ""}`}
      />
      {help && (
        <p id={`${id}-help`} className="mt-1.5 px-1 text-sm text-muted">
          {help}
        </p>
      )}
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </div>
  );
}

/** Label-on-top input used inside a Group, like the ticket rows in the app. */
export function GroupField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  const id = useId();
  return (
    <div className="px-5 py-3 focus-within:bg-accent-soft/40">
      <label htmlFor={id} className={`block text-sm ${error ? "text-error" : "text-muted"}`}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        {...props}
        className="w-full bg-transparent py-0.5 text-[17px] outline-none placeholder:text-muted/50"
      />
      {error && (
        <p id={`${id}-err`} role="alert" className="text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** A selectable row with a radio, for choices that need a sentence. */
export function Choice({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-card px-5 py-3 transition ${checked ? "border-accent" : "border-transparent"}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="size-5 shrink-0 accent-accent"
      />
      <span className="text-[17px]">{children}</span>
    </label>
  );
}

export function Segmented<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#e4e6ea] p-1">
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl text-[17px] transition has-focus-visible:outline-2 has-focus-visible:outline-accent ${value === o.value ? "bg-card font-semibold shadow-sm" : "text-muted"}`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="-ml-1 inline-flex min-h-11 items-center gap-1 text-[17px] text-accent hover:text-accent-dark">
      <svg viewBox="0 0 12 20" className="h-4 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <path d="M10 2L2 10l8 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </Link>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-16" aria-label="Loading">
      <span className="size-6 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}
