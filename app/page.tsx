import Image from "next/image";
import Link from "next/link";
import { StartClaim } from "@/components/StartClaim";

const cta =
  "inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-7 text-[17px] font-semibold text-white transition hover:bg-accent-dark focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent";

function CheckIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tick() {
  return (
    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
      <CheckIcon />
    </span>
  );
}

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-6 px-4 py-16 sm:px-6 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">{eyebrow}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2>
        {intro && <p className="mt-4 max-w-2xl text-lg text-muted">{intro}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/** A static example of the result screen. Labeled as an example so nobody reads it as their own claim. */
function ExampleCard() {
  const rows = [
    ["Original arrival", "7:00 PM"],
    ["Actual arrival, AUS", "10:25 PM"],
    ["Rule", "3h or more late"],
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-accent-soft/70 blur-2xl" aria-hidden />
      <div className="rounded-[28px] bg-card p-6 shadow-[0_20px_60px_-20px_rgba(17,20,24,0.25)]">
        <div className="flex items-center justify-between">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft">
            <Image src="/mark.png" alt="" width={22} height={27} />
          </div>
          <span className="rounded-lg bg-bg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Example
          </span>
        </div>
        <p className="mt-5 text-muted">You arrived in Austin 3h 25m late.</p>
        <p className="text-2xl font-bold tracking-tight">You&apos;re likely owed</p>
        <p className="text-6xl font-bold leading-none tracking-tight text-accent">$750</p>
        <p className="mt-2 text-muted">$250 × 3 passengers</p>
        <dl className="mt-5 divide-y divide-line rounded-2xl bg-bg px-4 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-3">
              <dt className="text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-center text-sm text-muted">Free to check. 10% only after you&apos;re paid.</p>
      </div>
    </div>
  );
}

const steps = [
  {
    title: "Add your flight",
    body: "Enter the flight number and date of the flight that got you to your final destination.",
  },
  {
    title: "We check the delay",
    body: "We compare your scheduled and actual arrival using flight data. If it was 3 or more hours late, we show what you're likely owed.",
  },
  {
    title: "We file, you get paid",
    body: "We file with the airline through its official channel and keep you posted by email. The airline pays you directly.",
  },
];

const qualifies = [
  "A US domestic flight, on any US airline",
  "Arrived at your final destination 3 or more hours late",
  "Any cause, including weather",
  "Flown within the past year",
  "$250 for every passenger on the booking",
  "One person can file for everyone on the booking",
];

const compare: { label: string; us: string; service: string; diy: string }[] = [
  { label: "What it costs", us: "10%, only after you're paid", service: "35% or more", diy: "Free" },
  { label: "Who pays you", us: "The airline, directly", service: "The service, after its cut", diy: "The airline" },
  { label: "Paperwork and follow-up", us: "We handle it", service: "They handle it", diy: "You do" },
  { label: "Updates", us: "By email at every step", service: "Often slow", diy: "Up to you" },
];

const trust = [
  {
    title: "Official channels only",
    body: "We file only through each airline's official claims channel. Every rights link goes to the airline or the US Department of Transportation.",
  },
  {
    title: "Your money comes straight to you",
    body: "The airline pays you directly, in cash or travel credit. It never passes through us.",
  },
  {
    title: "No surprise fees",
    body: "You see our fee before you add a card. Nothing is charged until the airline pays you, and nothing at all if it doesn't.",
  },
  {
    title: "We never ask for your airline login",
    body: "We only need what's in your confirmation email: the confirmation code, names, and ticket numbers.",
  },
];

const faqs = [
  {
    q: "What counts as 3 hours late?",
    a: "We compare when you actually reached your final destination with when you were scheduled to arrive. If your booking had connections, it's the arrival of your last flight that counts.",
  },
  {
    q: "I was rebooked. Isn't that my compensation?",
    a: "No. Getting you to your destination is the airline's job. Compensation for arriving 3 or more hours late is owed on top of that.",
  },
  {
    q: "Does the cause of the delay matter?",
    a: "No. Weather, crew, a late aircraft, or anything else. If you arrived 3 or more hours late, you're likely owed.",
  },
  {
    q: "How much could I get?",
    a: "$250 for each passenger on the booking. A family of three could be owed $750.",
  },
  {
    q: "What does Flightback cost?",
    a: "Checking your flight is free. If we file and the airline pays you, our fee is 10% of what you receive. On a $750 claim, that's $75. If the airline doesn't pay, you pay nothing.",
  },
  {
    q: "Why do you need a card?",
    a: "The airline pays you directly, so we save a card to collect our fee afterward. Nothing is charged when you file.",
  },
  {
    q: "How long does it take?",
    a: "Airlines respond within 30 days. We email you when they do, and we explain their reply in plain language.",
  },
  {
    q: "Is this a real service?",
    a: "Not yet. This site is a demo for a product case study. No claims are filed and no card is charged.",
  },
];

export default function Landing() {
  return (
    <div className="bg-card">
      <header className="px-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
          <Link href="/" aria-label="Flightback home">
            <Image src="/logo.png" alt="Flightback" width={134} height={24} priority />
          </Link>
          <nav className="flex items-center gap-6 text-[15px]">
            <a href="#how" className="hidden text-muted hover:text-ink sm:inline">
              How it works
            </a>
            <a href="#pricing" className="hidden text-muted hover:text-ink sm:inline">
              Pricing
            </a>
            <a href="#faq" className="hidden text-muted hover:text-ink sm:inline">
              FAQ
            </a>
            <StartClaim className="inline-flex min-h-10 items-center rounded-xl bg-accent px-4 text-[15px] font-semibold text-white hover:bg-accent-dark">
              Start my claim
            </StartClaim>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
                For US domestic flights
              </p>
              <h1 className="mt-5 text-[40px] font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Your flight was 3+ hours late. You may be owed $250 per passenger.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted sm:text-xl">
                We check your flight, file the claim, and only get paid if you do.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <StartClaim className={cta}>Start my claim</StartClaim>
                <p className="text-[15px] text-muted">Free to check. Takes about 2 minutes.</p>
              </div>
              <ul className="mt-10 grid gap-3 text-[15px] sm:grid-cols-3">
                {["Official airline channels only", "The airline pays you directly", "10% fee, only if you're paid"].map(
                  (t) => (
                    <li key={t} className="flex items-start gap-2">
                      <Tick />
                      <span>{t}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <ExampleCard />
          </div>
        </section>

        {/* The problem */}
        <section className="bg-ink px-4 py-16 text-white sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Flight trackers tell you you&apos;re late. Nobody tells you what you&apos;re owed.
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {[
                ["93%", "of Americans don't know their air passenger rights."],
                ["1 in 3", "passengers are told their rights during a disruption."],
                ["< 1 in 4", "eligible travelers ever file a claim."],
              ].map(([n, t]) => (
                <div key={n} className="border-t border-white/20 pt-5">
                  <p className="text-5xl font-bold tracking-tight">{n}</p>
                  <p className="mt-2 text-white/75">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Section
          id="how"
          eyebrow="How it works"
          title="From late arrival to money in your account"
          intro="You tell us about one flight. We do the rest, and the airline pays you directly."
          className="bg-bg"
        >
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-[24px] bg-card p-7">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          eyebrow="Do you qualify"
          title="If you got there 3 or more hours late, you're likely owed"
          intro="What matters is when you reached your final destination, not what happened on the way."
        >
          <div className="grid gap-10 lg:grid-cols-2">
            <ul className="grid gap-4">
              {qualifies.map((t) => (
                <li key={t} className="flex items-start gap-3 text-lg">
                  <Tick />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-[24px] bg-bg p-7">
              <h3 className="text-xl font-semibold">Not covered yet</h3>
              <ul className="mt-4 space-y-3 text-muted">
                <li>Cancelled or diverted flights. That&apos;s a different claim.</li>
                <li>International flights, including US flights to or from another country.</li>
                <li>Flights more than a year ago.</li>
              </ul>
              <StartClaim className={`${cta} mt-7 w-full`}>Start my claim</StartClaim>
            </div>
          </div>
        </Section>

        <Section
          id="pricing"
          eyebrow="Pricing"
          title="Free to check. 10% only if you're paid."
          intro="On a $750 claim for three passengers, our fee is $75. If the airline doesn't pay, you pay nothing."
          className="bg-bg"
        >
          {/* Cards on phones, a table on wider screens. */}
          <div className="hidden overflow-hidden rounded-[24px] bg-card md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="p-5 font-medium text-muted" scope="col">
                    <span className="sr-only">Feature</span>
                  </th>
                  <th className="bg-accent-soft p-5 text-lg font-semibold text-accent" scope="col">
                    Flightback
                  </th>
                  <th className="p-5 font-semibold" scope="col">
                    Typical claim services
                  </th>
                  <th className="p-5 font-semibold" scope="col">
                    Filing on your own
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {compare.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="p-5 font-medium text-muted">
                      {r.label}
                    </th>
                    <td className="bg-accent-soft/50 p-5 font-semibold">{r.us}</td>
                    <td className="p-5">{r.service}</td>
                    <td className="p-5">{r.diy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 md:hidden">
            {(
              [
                ["Flightback", "us"],
                ["Typical claim services", "service"],
                ["Filing on your own", "diy"],
              ] as const
            ).map(([name, key]) => (
              <div
                key={key}
                className={`rounded-[24px] bg-card p-6 ${key === "us" ? "border-2 border-accent" : ""}`}
              >
                <h3 className={`text-lg font-semibold ${key === "us" ? "text-accent" : ""}`}>{name}</h3>
                <dl className="mt-3 divide-y divide-line">
                  {compare.map((r) => (
                    <div key={r.label} className="flex justify-between gap-4 py-2.5">
                      <dt className="text-muted">{r.label}</dt>
                      <dd className="text-right font-medium">{r[key]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Built for trust"
          title="Scam sites target delayed travelers. Here is how we are different."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {trust.map((t) => (
              <div key={t.title} className="rounded-[24px] bg-bg p-7">
                <h3 className="text-lg font-semibold">{t.title}</h3>
                <p className="mt-2 text-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="faq" eyebrow="FAQ" title="Questions travelers ask" className="bg-bg">
          <div className="divide-y divide-line overflow-hidden rounded-[24px] bg-card">
            {faqs.map((f) => (
              <details key={f.q} className="group px-6">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <svg
                    viewBox="0 0 20 20"
                    className="size-5 shrink-0 text-muted transition group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="pb-5 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        {/* Closing call to action */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-[32px] bg-accent p-8 text-white sm:p-14">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Late by 3 hours or more? Find out what you&apos;re owed.
            </h2>
            <p className="text-lg text-white/80">Free to check. Takes about 2 minutes.</p>
            <StartClaim className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-7 text-[17px] font-semibold text-accent transition hover:bg-accent-soft">
              Start my claim
            </StartClaim>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <Image src="/logo.png" alt="Flightback" width={112} height={20} />
          <p>A demo built for a product case study. Not affiliated with any airline.</p>
        </div>
      </footer>
    </div>
  );
}
