import { callAction } from "@agent-native/core/client/hooks";
import { useEffect, useState } from "react";

type Invite = {
  id: string;
  recipient: string;
  createdAt: string;
  expiresAt: string;
  lastViewedAt: string | null;
};
type Result = { invites: Invite[]; created?: { token: string; recipient: string } };

const day = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// Private links that let a trusted person read the plan made for them.
export function SharePanel({ person, onNotice }: { person: string; onNotice: (m: string) => void }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [fresh, setFresh] = useState<{ url: string; recipient: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    callAction("iff-invite", { op: "list" })
      .then((r) => setInvites((r as unknown as Result).invites))
      .catch(() => {});
  }, []);

  async function create() {
    if (!person.trim()) return;
    setBusy(true);
    try {
      const r = (await callAction("iff-invite", { op: "create", recipient: person.trim() })) as unknown as Result;
      setInvites(r.invites);
      if (r.created) setFresh({ url: `${location.origin}/p/${r.created.token}`, recipient: r.created.recipient });
    } catch {
      onNotice("Couldn’t create the link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    const r = (await callAction("iff-invite", { op: "revoke", id })) as unknown as Result;
    setInvites(r.invites);
    onNotice("Link turned off.");
  }

  async function copy() {
    if (!fresh) return;
    await navigator.clipboard.writeText(fresh.url);
    onNotice("Link copied.");
  }

  return (
    <section className="ws-share" aria-label="Share this plan">
      <div className="ws-share-head">
        <div>
          <h2>Share with {person || "someone"}</h2>
          <p>
            They get a private link to read this plan. No account needed. They can’t see your records, and
            the page updates as you confirm more.
          </p>
        </div>
        <button className="ws-btn" disabled={busy || !person.trim()} onClick={() => void create()}>
          {busy ? "Creating…" : "Create link"}
        </button>
      </div>

      {fresh && (
        <div className="ws-share-new" role="status">
          <p>
            Link for <b>{fresh.recipient}</b>. Copy it now. For your safety we don’t store it, so you won’t
            see it again.
          </p>
          <div className="ws-share-url">
            <input readOnly value={fresh.url} onFocus={(e) => e.currentTarget.select()} aria-label="Share link" />
            <button className="ws-btn" onClick={() => void copy()}>
              Copy
            </button>
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <ul className="ws-share-list">
          {invites.map((i) => (
            <li key={i.id}>
              <div>
                <b>{i.recipient}</b>
                <span className="num">
                  Created {day(i.createdAt)} · expires {day(i.expiresAt)} ·{" "}
                  {i.lastViewedAt ? `opened ${day(i.lastViewedAt)}` : "not opened yet"}
                </span>
              </div>
              <button className="ws-btn ws-btn-line" onClick={() => void revoke(i.id)}>
                Turn off
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
