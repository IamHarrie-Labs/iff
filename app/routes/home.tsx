import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import {
  useActionQuery,
  useActionMutation,
  callAction,
} from "@agent-native/core/client/hooks";
import { IconX } from "@tabler/icons-react";
import { useRef, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";

import { AccountMenu } from "@/components/AccountMenu";
import { IffLogo } from "@/components/IffLogo";
import { SharePanel } from "@/components/SharePanel";

import type { State, Item } from "../../server/iff/domain";

import "../brand.css";
import "../iff.css";

export function meta() {
  return [{ title: "Iff — Workspace" }];
}

const TABS = [
  ["Discoveries", "Findings"],
  ["Sources", "Records"],
  ["Handover", "Plan"],
] as const;

const STATUS: Record<Item["status"], string> = {
  suggested: "Needs an answer",
  confirmed: "Confirmed",
  inactive: "Inactive",
};

const FILTERS = [
  ["all", "All"],
  ["suggested", "Needs an answer"],
  ["confirmed", "Confirmed"],
  ["inactive", "Inactive"],
] as const;

const CATEGORIES = [
  "Home & family",
  "Money & accounts",
  "Digital life",
  "Subscriptions",
  "Protection",
];

function fmtDate(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(amount: string, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** Show evidence the way a statement would: date, description, amount. */
function Evidence({ quote }: { quote: string }) {
  return (
    <div className="ev">
      {quote.split(/\r?\n/).map((line, i) => {
        const m = line.match(
          /^(\d{4}-\d{2}-\d{2}),\s*(.+?),\s*(-?[\d.]+),\s*([A-Z]{3})\s*$/,
        );
        return m ? (
          <div className="ev-row" key={i}>
            <span className="num">{fmtDate(m[1] ?? "")}</span>
            <span>{m[2]}</span>
            <span className="num ev-amt">{fmtMoney(m[3] ?? "", m[4] ?? "")}</span>
          </div>
        ) : (
          <p className="ev-text" key={i}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function Home() {
  const q = useActionQuery("iff-workspace", {});
  const s = q.data as State | undefined;
  const demo = useActionMutation("iff-demo"),
    imp = useActionMutation("iff-import"),
    edit = useActionMutation("iff-update"),
    note = useActionMutation("iff-note");
  const [params, setParams] = useSearchParams();
  const tab = params.get("view") ?? "Discoveries",
    id = params.get("item") ?? "";
  const setTab = (value: string) =>
    setParams((p) => {
      p.set("view", value);
      p.delete("item");
      return p;
    });
  const open = (value: string) =>
    setParams((p) => {
      if (value) p.set("item", value);
      else p.delete("item");
      return p;
    });
  const [filter, setFilter] = useState<string>("all"),
    [search, setSearch] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    person = params.get("for") ?? "Alex",
    setPerson = (value: string) =>
      setParams(
        (p) => {
          p.set("for", value);
          return p;
        },
        { replace: true },
      );
  const [exporting, setExporting] = useState(false);
  const [useDraft, setUseDraft] = useState(false);
  useEffect(() => setUseDraft(false), [id]);
  useEffect(() => {
    if (!id) return;
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, [id]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);
  const input = useRef<HTMLInputElement>(null);
  const busy =
    demo.isPending || imp.isPending || edit.isPending || note.isPending;
  const items = s?.items ?? [],
    pending = items.filter((i) => i.status === "suggested"),
    next = pending[0],
    planned = items.filter(
      (i) => i.status === "confirmed" && i.recipient && i.instructions,
    ),
    item = items.find((i) => i.id === id);
  const h = useActionQuery(
    "iff-handover",
    { recipient: person },
    { enabled: tab === "Handover" },
  );
  const guide = h.data as
    | {
        title: string;
        category: string;
        instructions: string;
        lastEvidence?: string;
        essential: boolean;
        openQuestion: string;
      }[]
    | undefined;
  const sourceName = (sid: string) =>
    s?.sources.find((x) => x.id === sid)?.name ?? "Record";

  async function run(fn: () => Promise<unknown>, message: string) {
    setError("");
    try {
      await fn();
      setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  async function files(list: FileList | null) {
    if (!list) return;
    const added: string[] = [];
    await run(async () => {
      for (const f of Array.from(list)) {
        if (f.size > 100000 || !/\.(csv|eml|txt)$/i.test(f.name))
          throw new Error("Choose CSV, EML or TXT files under 100 KB.");
        await imp.mutateAsync({ name: f.name, text: await f.text() });
        added.push(f.name);
      }
    }, "Records added. Iff is reading them now.");
    if (input.current) input.current.value = "";
    // The rules make a first pass on import. The agent then reads each new
    // record for what they missed and drafts answers for the owner to review.
    if (added.length) reviewRecords(added);
  }
  const reviewRecords = (names: string[]) =>
    sendToAgentChat({
      message:
        `I just added ${names.join(", ")}. Read ${names.length === 1 ? "it" : "them"} closely. ` +
        "Raise anything the built-in rules missed with iff-suggest, quoting the record exactly, " +
        "then draft answers with iff-draft for the new findings where the record gives enough to go on. " +
        "Finish with a short list of what you found and open the most important finding on my screen.",
      context: JSON.stringify({ view: "records", added: names }),
      submit: true,
      openSidebar: true,
    });
  async function exportGuide(copy = false) {
    setError("");
    setExporting(true);
    try {
      const result = await callAction("iff-export", { recipient: person });
      if (copy) {
        await navigator.clipboard.writeText(result.text);
        setNotice("Plan copied.");
      } else {
        const url = URL.createObjectURL(
          new Blob([result.text], { type: result.mimeType }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        setNotice("Plan downloaded.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t export the plan.");
    } finally {
      setExporting(false);
    }
  }
  const askIff = () =>
    sendToAgentChat({
      message: "What should I answer next so my plan is useful?",
      context: JSON.stringify({ view: tab, selectedId: id }),
      submit: false,
      openSidebar: true,
    });

  const shown = items.filter(
    (i) =>
      (filter === "all" || i.status === filter) &&
      `${i.title} ${i.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="ws iff-brand">
      <header className="ws-bar" inert={Boolean(id)}>
        <Link to="/welcome" className="ws-logo" aria-label="Iff home">
          <IffLogo />
        </Link>
        <nav className="ws-tabs" aria-label="Workspace">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "on" : ""}
              aria-current={tab === key ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              {label}
              {key === "Discoveries" && items.length > 0 && (
                <span className="num">{items.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="ws-bar-end">
          <button className="ws-ghost" onClick={askIff}>
            Ask Iff
          </button>
          <AccountMenu onNotice={setNotice} />
        </div>
      </header>

      <main className="ws-main" inert={Boolean(id)}>
        <input
          ref={input}
          type="file"
          hidden
          accept=".csv,.eml,.txt"
          multiple
          onChange={(e) => void files(e.target.files)}
        />
        {error && (
          <div className="ws-error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss">
              <IconX size={16} />
            </button>
          </div>
        )}
        <div className="ws-toast" role="status">
          {notice}
        </div>

        {q.isLoading ? (
          <div className="ws-loading" aria-label="Loading">
            <span />
            <span />
            <span />
          </div>
        ) : q.isError ? (
          <section className="ws-empty">
            <h1>We couldn’t open your workspace.</h1>
            <p>{String(q.error)}</p>
            <button className="ws-btn" onClick={() => void q.refetch()}>
              Try again
            </button>
          </section>
        ) : tab === "Discoveries" ? (
          !items.length ? (
            <section className="ws-empty">
              <h1>
                Start with a <em>sample household</em>
              </h1>
              <p>
                Load Maya’s fictional records to see how Iff works, or add your
                own CSV, EML or TXT files.
              </p>
              <div className="ws-row-btns">
                <button
                  className="ws-btn"
                  disabled={busy}
                  onClick={() =>
                    void run(() => demo.mutateAsync({}), "Sample records loaded.")
                  }
                >
                  {demo.isPending ? "Loading…" : "Load sample household"}
                </button>
                <button
                  className="ws-btn ws-btn-line"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                >
                  Add your records
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="ws-head">
                <h1>Your household</h1>
                <p className="ws-sum num">
                  <span>
                    <b>{items.length}</b> findings
                  </span>
                  <span>
                    <b className="ws-hl">{pending.length}</b> need an answer
                  </span>
                  <span>
                    <b>{planned.length}</b> in a plan
                  </span>
                </p>
              </section>

              {next ? (
                <section className="ws-next">
                  <div>
                    <p className="ws-kicker">Next question · {next.title}</p>
                    <h2>{next.question}</h2>
                  </div>
                  <button className="ws-btn" onClick={() => open(next.id)}>
                    Answer
                  </button>
                </section>
              ) : (
                <section className="ws-next">
                  <div>
                    <p className="ws-kicker">All answered</p>
                    <h2>Your plan is ready to review.</h2>
                  </div>
                  <button className="ws-btn" onClick={() => setTab("Handover")}>
                    Open plan
                  </button>
                </section>
              )}

              <section className="ws-list">
                <div className="ws-list-bar">
                  <div className="ws-chips" role="tablist" aria-label="Filter">
                    {FILTERS.map(([k, label]) => (
                      <button
                        key={k}
                        role="tab"
                        aria-selected={filter === k}
                        className={filter === k ? "on" : ""}
                        onClick={() => setFilter(k)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    className="ws-search"
                    aria-label="Search findings"
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="ws-table">
                  <div className="ws-th" aria-hidden="true">
                    <span>Finding</span>
                    <span>Area</span>
                    <span>Evidence</span>
                    <span>Status</span>
                  </div>
                  {shown.map((i) => (
                    <button key={i.id} className="ws-tr" onClick={() => open(i.id)}>
                      <span className="ws-td-title">
                        {i.title}
                        <small>
                          {i.draft && i.status !== "confirmed" ? <b className="ws-flag">Draft ready · </b> : null}
                          {i.origin === "agent" ? <b className="ws-flag">Found by Iff · </b> : null}
                          {i.recipient
                            ? `For ${i.recipient}${i.essential ? " · essential" : ""}`
                            : i.status === "inactive"
                              ? "A later record shows it was cancelled"
                              : i.question}
                        </small>
                      </span>
                      <span className="ws-td-muted">{i.category}</span>
                      <span className="ws-td-muted num">
                        {i.evidence.length}{" "}
                        {i.evidence.length === 1 ? "record" : "records"}
                      </span>
                      <span className={`ws-pill ws-pill-${i.status}`}>
                        {STATUS[i.status]}
                      </span>
                    </button>
                  ))}
                  {!shown.length && (
                    <p className="ws-none">Nothing matches this filter.</p>
                  )}
                </div>
              </section>
            </>
          )
        ) : tab === "Sources" ? (
          <>
            <section className="ws-head">
              <h1>Records</h1>
              <p className="ws-sub">
                Everything Iff knows comes from these files and your notes.
              </p>
            </section>
            <button
              className="ws-drop"
              disabled={busy}
              onClick={() => input.current?.click()}
            >
              <b>{imp.isPending ? "Adding…" : "Add records"}</b>
              <span>CSV statements, EML emails or TXT notes, up to 100 KB each</span>
            </button>
            <div className="ws-split">
              <section className="ws-paper">
                <h2>Add something only you know</h2>
                <form
                  className="ws-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      f = new FormData(form);
                    void run(async () => {
                      await note.mutateAsync({
                        title: String(f.get("title")),
                        note: String(f.get("note")),
                        category: f.get("category") as "Home & family",
                      });
                      form.reset();
                    }, "Note saved as a finding.");
                  }}
                >
                  <label>
                    What is it?
                    <input
                      name="title"
                      required
                      maxLength={120}
                      placeholder="Mum’s monthly rent"
                    />
                  </label>
                  <label>
                    Area
                    <select name="category">
                      {CATEGORIES.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Details
                    <textarea
                      name="note"
                      required
                      maxLength={4000}
                      rows={3}
                      placeholder="Who it’s for, how it’s paid, who to call"
                    />
                  </label>
                  <button className="ws-btn" disabled={busy} type="submit">
                    {note.isPending ? "Saving…" : "Save note"}
                  </button>
                </form>
              </section>
              <section className="ws-files">
                <p className="ws-kicker num">
                  {s?.sources.length ?? 0} records
                </p>
                {!s?.sources.length && (
                  <p className="ws-none">No records yet.</p>
                )}
                {s?.sources.map((src) => (
                  <details key={src.id}>
                    <summary>
                      <span>{src.name}</span>
                      <span className="num">{fmtDate(src.date)}</span>
                    </summary>
                    <pre>{src.text}</pre>
                  </details>
                ))}
              </section>
            </div>
          </>
        ) : (
          <>
            <section className="ws-head">
              <h1>Plan</h1>
              <p className="ws-sub">
                Only confirmed items assigned to this person appear here. Your
                original records stay out of it.
              </p>
            </section>
            <div className="ws-plan-bar">
              <label>
                Prepared for
                <input
                  value={person}
                  maxLength={100}
                  onChange={(e) => setPerson(e.target.value)}
                />
              </label>
              <div className="ws-row-btns">
                <button
                  className="ws-btn ws-btn-line"
                  disabled={!guide?.length || exporting}
                  onClick={() => void exportGuide(true)}
                >
                  Copy
                </button>
                <button
                  className="ws-btn"
                  disabled={!guide?.length || exporting}
                  onClick={() => void exportGuide()}
                >
                  Download
                </button>
              </div>
            </div>
            {h.isLoading ? (
              <div className="ws-loading">
                <span />
                <span />
              </div>
            ) : h.isError ? (
              <p role="alert" className="ws-none">
                Couldn’t prepare this plan. Try another name.
              </p>
            ) : !guide?.length ? (
              <section className="ws-empty">
                <h1>
                  Nothing for <em>{person || "this person"}</em> yet
                </h1>
                <p>Confirm a finding and assign it to them to start the plan.</p>
                <button className="ws-btn" onClick={() => setTab("Discoveries")}>
                  Review findings
                </button>
              </section>
            ) : (
              <article className="ws-doc">
                <header>
                  <p className="ws-kicker num">
                    {guide.length} {guide.length === 1 ? "item" : "items"}
                  </p>
                  <h2>
                    If I can’t handle things, <em>{person}</em>, start here.
                  </h2>
                </header>
                <ol>
                  {guide.map((g, n) => (
                    <li key={g.title}>
                      <span className="num ws-doc-n">
                        {String(n + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3>
                          {g.title}
                          {g.essential && <span className="ws-tag">Essential</span>}
                        </h3>
                        <p>{g.instructions}</p>
                        <small className="num">
                          {g.category}
                          {g.lastEvidence ? ` · last seen ${fmtDate(g.lastEvidence)}` : ""}
                        </small>
                        {g.openQuestion && (
                          <small className="ws-open">Still open: {g.openQuestion}</small>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <footer>
                  This plan gives no account access or legal authority. It is a
                  guide, sent by you.
                </footer>
              </article>
            )}
            {guide && guide.length > 0 && <SharePanel person={person} onNotice={setNotice} />}
          </>
        )}
      </main>

      {item && (
        <div className="ws-scrim" onClick={() => open("")}>
          <section
            className="ws-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") open("");
              if (e.key === "Tab") {
                const nodes = Array.from(
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "button:not(:disabled),input,select,textarea,a[href]",
                  ),
                );
                const first = nodes[0],
                  last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <div className="ws-sheet-head">
              <div>
                <p className="ws-kicker">{item.category}</p>
                <h2>{item.title}</h2>
              </div>
              <button
                className="ws-close"
                autoFocus
                onClick={() => open("")}
                aria-label="Close"
              >
                <IconX size={18} />
              </button>
            </div>
            <span className={`ws-pill ws-pill-${item.status}`}>
              {STATUS[item.status]}
            </span>

            <h3 className="ws-h3">What the records show</h3>
            {item.evidence.map((e, i) => (
              <div className="ws-ev" key={e.sourceId + i}>
                <p className="ws-ev-src">
                  {sourceName(e.sourceId)}
                  <span className="num"> · {fmtDate(e.date)}</span>
                </p>
                <Evidence quote={e.quote} />
              </div>
            ))}
            <p className="ws-caveat">
              Past records are a starting point. They don’t prove who owns an
              account today, what it holds or what it covers.
            </p>

            {item.draft && !useDraft && (
              <div className="ws-draft">
                <p className="ws-draft-label">Suggested by Iff</p>
                <p className="ws-draft-text">{item.draft.instructions}</p>
                <p className="ws-draft-why">
                  {item.draft.recipient ? `For ${item.draft.recipient}. ` : ""}
                  {item.draft.reason}
                </p>
                <div className="ws-row-btns">
                  <button className="ws-btn" type="button" onClick={() => setUseDraft(true)}>
                    Use this draft
                  </button>
                </div>
                <p className="ws-draft-note">Nothing changes until you review it and save.</p>
              </div>
            )}

            <form
              key={item.id + (useDraft ? ":draft" : "")}
              className="ws-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run(
                  () =>
                    edit.mutateAsync({
                      id: item.id,
                      status: f.get("status") as Item["status"],
                      instructions: String(f.get("instructions")),
                      recipient: String(f.get("recipient")).trim(),
                      essential: f.get("essential") === "on",
                    }),
                  "Saved. The plan is up to date.",
                );
              }}
            >
              <h3 className="ws-h3">Your answer</h3>
              <p className="ws-question">{item.question}</p>
              <label>
                Status
                <select name="status" defaultValue={item.status}>
                  <option value="suggested">Needs an answer</option>
                  <option value="confirmed">Confirmed by me</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                What should someone know?
                <textarea
                  name="instructions"
                  maxLength={4000}
                  rows={4}
                  defaultValue={useDraft && item.draft ? item.draft.instructions : item.instructions}
                  placeholder="What it’s for, what to do next, where the details are"
                />
              </label>
              <label>
                Who should handle it?
                <input
                  name="recipient"
                  maxLength={100}
                  defaultValue={useDraft && item.draft ? item.draft.recipient : item.recipient}
                  placeholder="Alex"
                />
              </label>
              <label className="ws-check">
                <input
                  type="checkbox"
                  name="essential"
                  defaultChecked={useDraft && item.draft ? item.draft.essential : item.essential}
                />
                Someone depends on this
              </label>
              <button className="ws-btn" disabled={busy} type="submit">
                {edit.isPending ? "Saving…" : "Save"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
