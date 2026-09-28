"use client";

import Link from "next/link";
import { useId } from "react";

export function Button({
  loading,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-base font-semibold text-white transition hover:bg-accent-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent px-5 text-base font-semibold text-white transition hover:bg-accent-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </Link>
  );
}

export function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-card p-5 ${className}`}>{children}</div>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-[28px]">{children}</h1>;
}

export function Muted({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-muted ${className}`}>{children}</p>;
}

export function ErrorText({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-error">
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
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={described}
        {...props}
        className={`min-h-13 w-full rounded-xl border bg-white px-4 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25 ${error ? "border-error" : "border-line"} ${props.className ?? ""}`}
      />
      {help && (
        <p id={`${id}-help`} className="mt-1.5 text-sm text-muted">
          {help}
        </p>
      )}
      <ErrorText id={`${id}-err`}>{error}</ErrorText>
    </div>
  );
}

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
      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 transition ${checked ? "border-accent ring-2 ring-accent/25" : "border-line"}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="size-5 accent-accent"
      />
      <span className="text-base">{children}</span>
    </label>
  );
}

export function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-ink">
      Back
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
