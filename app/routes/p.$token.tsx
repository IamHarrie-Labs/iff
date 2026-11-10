import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { LegalPage } from "@/components/LegalPage";

type Entry = {
  title: string;
  category: string;
  essential: boolean;
  instructions: string;
  lastEvidence: string;
  openQuestion: string;
};
type Plan = { recipient: string; expiresAt: string; items: Entry[] };

export function meta() {
  return [{ title: "A plan shared with you · Iff" }, { name: "robots", content: "noindex, nofollow" }];
}

const fmt = (d: string) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime())
    ? d
    : t.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

export default function SharedPlan() {
  const { token = "" } = useParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/iff/shared/${encodeURIComponent(token)}`, { credentials: "omit", referrerPolicy: "no-referrer" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((p: Plan) => live && setPlan(p))
      .catch(() => live && setGone(true));
    return () => {
      live = false;
    };
  }, [token]);

  if (gone)
    return (
      <LegalPage updated={false} back="What is Iff?" label="Shared plan" title="This link isn’t working" intro="It may have expired, or the person who sent it turned it off.">
        <p className="sp-gone">Ask them to send you a new link.</p>
      </LegalPage>
    );

  return (
    <LegalPage
      updated={false}
      back="What is Iff?"
      label="Shared with you"
      title={
        plan ? (
          <>
            {plan.recipient}, <em>start here</em>
          </>
        ) : (
          "Opening the plan…"
        )
      }
      intro="Someone you know wrote this down for a time they can’t handle things themselves. Each item is something they checked and confirmed."
    >
      {plan && (
        <>
          <div className="sp-card">
            {plan.items.length === 0 ? (
              <p className="sp-empty">Nothing has been confirmed for you yet. This page updates as they add items.</p>
            ) : (
              plan.items.map((i) => (
                <article className="sp-item" key={i.title}>
                  <div className="sp-item-top">
                    <h2>{i.title}</h2>
                    {i.essential && <span className="sp-tag">Someone relies on this</span>}
                  </div>
                  <p className="sp-cat">{i.category}</p>
                  <p className="sp-do">{i.instructions}</p>
                  {i.openQuestion && <p className="sp-open">Still to clarify: {i.openQuestion}</p>}
                  <p className="sp-meta">Last seen in their records {fmt(i.lastEvidence)}</p>
                </article>
              ))
            )}
          </div>
          <p className="sp-note">
            This page gives you no access to any account, and Iff can’t move money. The link works until{" "}
            {fmt(plan.expiresAt)}. Please don’t forward it.
          </p>
        </>
      )}
    </LegalPage>
  );
}
