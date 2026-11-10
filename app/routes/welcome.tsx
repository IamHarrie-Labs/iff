import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { IffLogo } from "@/components/IffLogo";
import { useMe } from "@/lib/use-me";

import "../brand.css";
import "../welcome.css";

export function meta() {
  return [
    { title: "Iff — A plan for the people who step in" },
    {
      name: "description",
      content:
        "Iff turns your statements and emails into a plan someone you trust can follow.",
    },
  ];
}

const endings = [
  "you’re in hospital?",
  "you lose your phone?",
  "you’re stuck abroad?",
  "you can’t answer?",
];

const ticker = [
  ["Mortgage", "£1,250 monthly"],
  ["Mum’s rent", "£300 monthly"],
  ["Cloud storage", "£2.99 monthly"],
  ["Workplace pension", "£185 monthly"],
  ["Car insurance", "renews in March"],
  ["Brokerage account", "opened 2019"],
  ["Adobe", "cancelled in October"],
  ["Meal kit", "£32 per delivery"],
];

const rows = [
  { title: "Mortgage", cat: "Home", src: 2, state: "In Alex’s plan", tone: "in" },
  { title: "Support transfer", cat: "Family", src: 2, state: "Needs an answer", tone: "needs" },
  { title: "Workplace pension", cat: "Money", src: 1, state: "Needs an answer", tone: "needs" },
  { title: "Cloud storage", cat: "Digital", src: 1, state: "Found", tone: "found" },
  { title: "Adobe", cat: "Subscription", src: 2, state: "Cancelled", tone: "cancelled" },
];

const steps = [
  {
    title: "Add your records",
    body: "Upload a few statements and emails. Iff picks out what repeats, renews or supports someone.",
  },
  {
    title: "Answer what it can’t tell",
    body: "A £300 transfer leaves every month. Iff shows you the line and asks who relies on it.",
  },
  {
    title: "Confirm what’s true",
    body: "Add the context only you know. The agent can suggest an answer, but only you can confirm one.",
  },
  {
    title: "Share the plan",
    body: "Alex sees what to pay, where it comes from and who to call. Your original records stay with you.",
  },
];

const never = [
  "Move money",
  "Contact your bank",
  "Guess a balance",
  "Share your records",
];

// Opens a private sample workspace. No sign-up; it expires after a day.
function TryButton({ className, children }: { className: string; children: React.ReactNode }) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/iff/guest", { method: "POST", credentials: "same-origin" });
      if (!r.ok) throw new Error(String(r.status));
      const { redirect } = (await r.json()) as { redirect?: string };
      nav(redirect ?? "/home");
    } catch {
      setErr("Couldn’t open the sample. Try again.");
      setBusy(false);
    }
  }
  return (
    <>
      <button type="button" className={className} onClick={go} disabled={busy} aria-busy={busy}>
        {busy ? "Opening…" : children}
      </button>
      {err && <span className="w-err" role="alert">{err}</span>}
    </>
  );
}

// Signed-in people go straight back to their workspace.
function NavEnd() {
  const me = useMe().data;
  if (me?.signedIn)
    return (
      <Link to="/home" className="w-btn w-btn-sm">
        {me.guest ? "Back to sample" : "Your workspace"}
      </Link>
    );
  return (
    <div className="w-nav-end">
      <a href="/start" className="w-signin">
        Sign in
      </a>
      <TryButton className="w-btn w-btn-sm">Try Iff</TryButton>
    </div>
  );
}

function Rise({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          <span className="w-mask">
            <span style={{ animationDelay: `${i * 70}ms` }}>{w}</span>
          </span>{" "}
        </Fragment>
      ))}
    </>
  );
}

export default function Welcome() {
  const [n, setN] = useState(0);
  const [step, setStep] = useState(0);
  const page = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setN((v) => (v + 1) % endings.length), 3400);
    return () => clearInterval(t);
  }, []);

  // Reveal on scroll.
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.18 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Story steps drive the sticky product card.
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step));
        }),
      { rootMargin: "-48% 0px -48% 0px" },
    );
    document.querySelectorAll("[data-step]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Scroll-linked tilt for the product frame, and the cursor light.
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = frame.current;
        if (!el || reduce) return;
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, 1 - (r.top - innerHeight * 0.25) / (innerHeight * 0.75)));
        el.style.setProperty("--p", p.toFixed(3));
      });
    };
    const onMove = (e: PointerEvent) => {
      page.current?.style.setProperty("--mx", `${e.clientX}px`);
      page.current?.style.setProperty("--my", `${e.clientY}px`);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    if (!matchMedia("(pointer: coarse)").matches) addEventListener("pointermove", onMove);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="welcome iff-brand" ref={page}>
      <div className="w-light" aria-hidden="true" />

      <header className="w-nav">
        <Link to="/welcome" className="w-logo" aria-label="Iff">
          <IffLogo />
        </Link>
        <nav aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#limits">Limits</a>
        </nav>
        <NavEnd />
      </header>

      <main>
        <section className="w-hero">
          <h1 aria-label={`Who pays the bills if ${endings[n]}`}>
            <span className="w-l1" aria-hidden="true">
              <Rise text="Who pays the bills" />
            </span>
            <span className="w-l2" aria-hidden="true">
              <em className="w-if">if</em>{" "}
              <span className="w-rotor" key={n}>
                <Rise text={endings[n] ?? ""} />
              </span>
            </span>
          </h1>
          <div className="w-hero-row">
            <p>
              Iff turns your statements and emails into a plan someone you
              trust can follow.
            </p>
            <TryButton className="w-btn">
              Try it with sample data
            </TryButton>
          </div>
        </section>

        <section className="w-frame-wrap" aria-label="Product preview">
          <div className="w-frame" ref={frame}>
            <div className="w-frame-head">
              <span>
                Your household
              </span>
              <span className="num">9 findings · 6 need an answer</span>
            </div>
            <div className="w-table">
              {rows.map((r) => (
                <div className="w-row" key={r.title}>
                  <span className="w-row-title">{r.title}</span>
                  <span className="w-row-cat">{r.cat}</span>
                  <span className="w-row-src num">{r.src} {r.src === 1 ? "record" : "records"}</span>
                  <span className={`w-pill w-pill-${r.tone}`}>
                    {r.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-ticker" aria-label="Examples of what Iff finds">
          <div className="w-ticker-track">
            {[...ticker, ...ticker].map(([a, b], i) => (
              <span key={i} aria-hidden={i >= ticker.length}>
                <b>{a}</b> {b}
              </span>
            ))}
          </div>
        </section>

        <section className="w-story" id="how">
          <div className="w-story-text">
            <p className="w-label" data-reveal>
              How it works
            </p>
            <h2 data-reveal>
              From a pile of records to a plan <em>in four steps</em>
            </h2>
            {steps.map((s, i) => (
              <article key={s.title} data-step={i} className={step === i ? "on" : ""}>
                <span className="num">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>

          <div className="w-stage" aria-hidden="true">
            <div className="w-card" data-s={step}>
              <div className="w-card-top">
                <b>Support transfer</b>
                <span className="w-badge">
                  {["Found", "Needs an answer", "Confirmed", "In Alex’s plan"][step]}
                </span>
              </div>
              <div className="w-ledger">
                <span className="num">3 Nov 2026</span>
                <span>Wise · Family support</span>
                <span className="num">−£300.00</span>
              </div>
              <p className="w-card-q">Does someone rely on this transfer?</p>
              <div className="w-card-a">
                “It’s Mum’s rent. Keep paying it and check the date with her.”
                <span>Marked essential</span>
              </div>
              <div className="w-card-plan">
                <small>Alex’s plan</small>
                <div>
                  <b>Mortgage</b>
                  <span>From the salary account on the 1st</span>
                </div>
                <div className="w-new">
                  <b>Mum’s rent</b>
                  <span>£300 monthly, confirm the date with her</span>
                </div>
              </div>
            </div>
            <div className="w-progress">
              {steps.map((_, i) => (
                <i key={i} className={i <= step ? "on" : ""} />
              ))}
            </div>
          </div>
        </section>

        <section className="w-quote">
          <p data-reveal>
            Most households run on what one person remembers.{" "}
            <em>Iff writes it down</em>, with the evidence attached.
          </p>
        </section>

        <section className="w-limits" id="limits">
          <p className="w-label" data-reveal>
            What Iff can’t do
          </p>
          <ul>
            {never.map((t, i) => (
              <li key={t} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="w-limits-note" data-reveal>
            It reads what you upload and drafts what you approve. Anything that
            leaves the app goes through you.
          </p>
        </section>

        <section className="w-end">
          <h2 data-reveal>
            Start with a <em>sample household</em>
          </h2>
          <div className="w-end-cta">
            <TryButton className="w-btn w-btn-ink">
              Open the demo
            </TryButton>
            <p>No sign-up. Private to this browser, deleted after 24 hours.</p>
          </div>
        </section>
      </main>

      <footer className="w-foot">
        <span className="w-foot-mark">
          <IffLogo />
        </span>
        <div className="w-foot-links">
          <nav aria-label="Legal">
            <Link to="/trust">How we handle data</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
          <span>Built with Agent-Native. Sample data is fictional.</span>
        </div>
      </footer>
    </div>
  );
}
