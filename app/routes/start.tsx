import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";

import { IffLogo } from "@/components/IffLogo";
import { SiteFooter } from "@/components/LegalPage";
import { useMe } from "@/lib/use-me";

import "../brand.css";
import "../legal.css";

export function meta() {
  return [
    { title: "Sign in · Iff" },
    { name: "description", content: "Sign in to Iff with a passkey. No email, no password." },
  ];
}

async function post(step: string, body?: unknown) {
  const r = await fetch(`/api/iff/passkey/${step}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await r.json().catch(() => ({}))) as {
    message?: string;
    statusMessage?: string;
    stack?: string[];
    redirect?: string;
  };
  if (!r.ok)
    throw new Error(data.statusMessage || data.message || data.stack?.[0] || "Something went wrong. Try again.");
  return data;
}

// Cancelling the device prompt isn't an error worth shouting about.
const quiet = (e: unknown) =>
  e instanceof Error && (e.name === "NotAllowedError" || e.name === "AbortError")
    ? "Cancelled. Try again when you’re ready."
    : e instanceof Error
      ? e.message
      : "Something went wrong. Try again.";

export default function Start() {
  const nav = useNavigate();
  const me = useMe().data;
  const guest = Boolean(me?.signedIn && me.guest);
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState<"" | "in" | "new">("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => setSupported(browserSupportsWebAuthn()), []);
  useEffect(() => {
    if (me?.signedIn && !me.guest) nav("/home", { replace: true });
  }, [me, nav]);

  async function signIn() {
    setBusy("in");
    setError("");
    try {
      const optionsJSON = await post("login-options");
      const response = await startAuthentication({ optionsJSON: optionsJSON as never });
      const r = await post("login-verify", response);
      location.assign(r.redirect ?? "/home");
    } catch (e) {
      setError(quiet(e));
      setBusy("");
    }
  }

  async function create() {
    setBusy("new");
    setError("");
    try {
      const optionsJSON = await post("register-options", { name: name.trim() });
      const response = await startRegistration({ optionsJSON: optionsJSON as never });
      const r = await post("register-verify", response);
      location.assign(r.redirect ?? "/home");
    } catch (e) {
      setError(quiet(e));
      setBusy("");
    }
  }

  return (
    <div className="lg iff-brand">
      <header className="lg-nav">
        <Link to="/welcome" className="lg-logo" aria-label="Iff home">
          <IffLogo />
        </Link>
        <Link to={guest ? "/home" : "/welcome"} className="lg-back">
          {guest ? "Back to sample" : "Back to Iff"}
        </Link>
      </header>

      <main className="lg-main st">
        <p className="lg-label">{guest ? "Keep your workspace" : "Sign in"}</p>
        <h1>{guest ? <>Save this <em>workspace</em></> : <>Welcome <em>back</em></>}</h1>
        <p className="lg-intro">
          {guest
            ? "Create a passkey and everything in your sample workspace stays yours, past the 24 hours."
            : "Use the passkey on this device. No email, no password."}
        </p>

        {!supported ? (
          <p className="st-error" role="alert">
            This browser can’t use passkeys. Try a recent version of Safari, Chrome, Edge or Firefox.
          </p>
        ) : (
          <div className="st-card">
            {!guest && (
              <>
                <button className="st-btn" disabled={Boolean(busy)} onClick={() => void signIn()}>
                  {busy === "in" ? "Waiting for your device…" : "Sign in with a passkey"}
                </button>
                <div className="st-or">
                  <span>New to Iff?</span>
                </div>
              </>
            )}
            <label className="st-field">
              What should we call you? <small>Optional</small>
              <input
                value={name}
                maxLength={40}
                autoComplete="nickname"
                placeholder="Maya"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className={guest ? "st-btn" : "st-btn st-btn-line"}
              disabled={Boolean(busy)}
              onClick={() => void create()}
            >
              {busy === "new" ? "Waiting for your device…" : guest ? "Save with a passkey" : "Create an account with a passkey"}
            </button>
            {error && (
              <p className="st-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="st-notes">
          <p>
            Your passkey stays on your device, unlocked with Face ID, a fingerprint or your PIN. Iff keeps only its
            public half, which can’t be used to sign in on its own.
          </p>
          <p>
            There’s no email on the account, so if you lose every device with the passkey we can’t recover it.
            Download your data from the account menu now and then.
          </p>
          {!guest && (
            <p>
              <a href="/sign-in?c=JTJGaG9tZQ">Use email and password instead</a>
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
