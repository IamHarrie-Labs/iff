import type { ReactNode } from "react";
import { Link } from "react-router";

import { IffLogo } from "@/components/IffLogo";

import "../brand.css";
import "../legal.css";

export const UPDATED = "10 November 2026";

// Set VITE_IFF_CONTACT_EMAIL at build time to publish a contact address.
export const CONTACT: string | undefined = import.meta.env.VITE_IFF_CONTACT_EMAIL || undefined;

export function Contact() {
  return CONTACT ? (
    <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
  ) : (
    <span>the contact address on our project page</span>
  );
}

export function SiteFooter() {
  return (
    <footer className="lg-foot">
      <nav aria-label="Legal">
        <Link to="/trust">How we handle data</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </nav>
      <span>Iff is an independent project. Sample data is fictional.</span>
    </footer>
  );
}

export function LegalPage({
  label,
  title,
  intro,
  children,
  updated = true,
  back = "Back to Iff",
}: {
  updated?: boolean;
  back?: string;
  label: string;
  title: ReactNode;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="lg iff-brand">
      <header className="lg-nav">
        <Link to="/welcome" className="lg-logo" aria-label="Iff home">
          <IffLogo />
        </Link>
        <Link to="/welcome" className="lg-back">
          {back}
        </Link>
      </header>
      <main className="lg-main">
        <p className="lg-label">{label}</p>
        <h1>{title}</h1>
        <p className="lg-intro">{intro}</p>
        {updated && <p className="lg-updated">Last updated {UPDATED}</p>}
        <div className="lg-body">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
