import { callAction } from "@agent-native/core/client/hooks";
import { signOut } from "@agent-native/core/client/sign-out";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { useMe } from "@/lib/use-me";

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "less than an hour";
  const h = Math.floor(ms / 3600000);
  return h >= 1 ? `${h} ${h === 1 ? "hour" : "hours"}` : "less than an hour";
}

export function AccountMenu({ onNotice }: { onNotice: (m: string) => void }) {
  const me = useMe().data;
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof PointerEvent && root.current?.contains(e.target as Node)) return;
      setOpen(false);
      setConfirming(false);
    };
    addEventListener("pointerdown", close);
    addEventListener("keydown", close);
    return () => {
      removeEventListener("pointerdown", close);
      removeEventListener("keydown", close);
    };
  }, [open]);

  if (!me?.signedIn) return null;
  const initial = me.guest ? "G" : (me.name?.[0] ?? me.email?.[0] ?? "I").toUpperCase();

  async function download() {
    setBusy(true);
    try {
      const r = (await callAction("iff-my-data", { op: "export" })) as { filename: string; text: string };
      const url = URL.createObjectURL(new Blob([r.text], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      onNotice("Your data is downloading.");
    } catch {
      onNotice("Couldn’t prepare the download. Try again.");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  async function erase() {
    setBusy(true);
    try {
      await callAction("iff-my-data", { op: "delete" });
      location.assign("/home");
    } catch {
      onNotice("Couldn’t delete the workspace. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="ws-acct" ref={root}>
      <button
        className="ws-avatar"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {initial}
      </button>
      {open && (
        <div className="ws-menu" role="menu">
          <div className="ws-menu-who">
            {me.guest ? (
              <>
                <b>Sample workspace</b>
                <span>
                  Private to this browser.
                  {me.expiresAt ? ` Deleted in ${timeLeft(me.expiresAt)}.` : ""}
                </span>
              </>
            ) : (
              <>
                <b>{me.email ?? me.name ?? "Your account"}</b>
                <span>{me.passkey ? "Signed in with a passkey" : "Your workspace"}</span>
              </>
            )}
          </div>
          {me.guest && (
            <Link role="menuitem" to="/start" className="ws-menu-keep">
              Keep this workspace
            </Link>
          )}
          <button role="menuitem" disabled={busy} onClick={() => void download()}>
            Download my data
          </button>
          {confirming ? (
            <div className="ws-menu-confirm">
              <p>This removes every record, finding and plan, and turns off your share links. It can’t be undone.</p>
              <div>
                <button className="ws-danger" disabled={busy} onClick={() => void erase()}>
                  Delete everything
                </button>
                <button onClick={() => setConfirming(false)}>Keep</button>
              </div>
            </div>
          ) : (
            <button role="menuitem" className="ws-menu-danger" onClick={() => setConfirming(true)}>
              Delete my workspace
            </button>
          )}
          <hr />
          <Link role="menuitem" to="/trust">
            How we handle data
          </Link>
          <Link role="menuitem" to="/privacy">
            Privacy notice
          </Link>
          <Link role="menuitem" to="/terms">
            Terms of use
          </Link>
          {me.admin && (
            <>
              <hr />
              <Link role="menuitem" to="/settings/agent">
                Operator settings
              </Link>
            </>
          )}
          <hr />
          <button
            role="menuitem"
            onClick={() => void signOut().finally(() => location.assign("/welcome"))}
          >
            {me.guest ? "Leave sample workspace" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
