import { createHash } from "node:crypto";

export type Source = { id: string; name: string; text: string; date: string };
export type Item = {
  id: string;
  title: string;
  category: string;
  status: "suggested" | "confirmed" | "inactive";
  evidence: { sourceId: string; quote: string; date: string }[];
  question: string;
  instructions: string;
  recipient: string;
  essential: boolean;
  // Who raised this finding: Iff's built-in rules, the owner's own note, or the agent.
  origin?: "rules" | "note" | "agent";
  // An answer the agent proposes. It never changes the item until the owner
  // reviews it and saves their own answer.
  draft?: Draft;
};
export type Draft = {
  instructions: string;
  recipient: string;
  essential: boolean;
  reason: string;
  at: string;
};
export type State = { sources: Source[]; items: Item[]; activity: string[] };
export const empty = (): State => ({ sources: [], items: [], activity: [] });
const hash = (s: string) =>
  createHash("sha256").update(s).digest("hex").slice(0, 16);
const rules = [
  {
    name: "Cloud storage",
    pattern: /icloud|google one|dropbox/i,
    category: "Digital life",
    question: "Do family photos or important files depend on this storage?",
  },
  {
    name: "Adobe subscription",
    pattern: /adobe/i,
    category: "Subscriptions",
    question: "Is this still needed, and who should manage it?",
  },
  {
    name: "Meal-kit subscription",
    pattern: /hellofresh|meal.?kit/i,
    category: "Subscriptions",
    question: "Should someone keep this service running?",
  },
  {
    name: "Investment account",
    pattern: /brokerage|fidelity|vanguard/i,
    category: "Money & accounts",
    question:
      "Is this account still open? Where can a trusted person find current details?",
  },
  {
    name: "Home payment",
    pattern: /mortgage|rent payment/i,
    category: "Home & family",
    question: "Who should handle this payment if you are unavailable?",
  },
  {
    name: "Support transfer",
    pattern: /wise|family support|support transfer/i,
    category: "Home & family",
    question: "Does someone depend on this transfer? What is it for?",
  },
  {
    name: "Retirement savings",
    pattern: /pension|401\(k\)|superannuation/i,
    category: "Money & accounts",
    question:
      "Where is the latest statement, and which provider should someone contact?",
  },
  {
    name: "Insurance reference",
    pattern: /insurance|premium|policy number/i,
    category: "Protection",
    question:
      "Can you provide the policy document to confirm what this covers?",
  },
];

export function ingest(state: State, name: string, text: string): State {
  const id = hash(name + "\n" + text);
  if (state.sources.some((s) => s.id === id)) return state;
  const dateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const date = dateMatch?.[0] ?? "Date unknown";
  const source = { id, name, text, date };
  state.sources.push(source);
  for (const rule of rules) {
    const lines = text.split(/\r?\n/).filter((line) => rule.pattern.test(line));
    if (!lines.length) continue;
    const quote = lines.slice(0, 5).join("\n");
    let item = state.items.find((i) => i.title === rule.name);
    if (!item) {
      item = {
        id: hash(rule.name),
        title: rule.name,
        category: rule.category,
        status: "suggested",
        evidence: [],
        question: rule.question,
        instructions: "",
        recipient: "",
        essential: false,
      };
      state.items.push(item);
    }
    const evidenceDate = quote.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0] ?? date;
    item.evidence.push({ sourceId: id, quote, date: evidenceDate });
    // A cancellation applies only when the service appears on that same line.
    const cancellations = item.evidence.filter((e) =>
      e.quote
        .split("\n")
        .some(
          (l) =>
            rule.pattern.test(l) &&
            /cancelled|canceled|closed|terminated/i.test(l),
        ),
    );
    const latestCancel = cancellations
      .map((e) => e.date)
      .filter((d) => d !== "Date unknown")
      .sort()
      .at(-1);
    const laterPayment = item.evidence.some(
      (e) =>
        e.date !== "Date unknown" &&
        latestCancel &&
        e.date > latestCancel &&
        /receipt|payment|charged/i.test(e.quote),
    );
    if (latestCancel && !laterPayment) item.status = "inactive";
    else if (latestCancel && laterPayment && item.status === "inactive")
      item.status = "suggested";
  }
  state.activity.unshift(`Imported ${name}`);
  return state;
}
export function handover(state: State, recipient: string) {
  return state.items
    .filter((i) => i.recipient === recipient && i.status === "confirmed")
    .map((i) => ({
      title: i.title,
      category: i.category,
      essential: i.essential,
      instructions: i.instructions || "Instructions still needed",
      lastEvidence:
        i.evidence
          .map((e) => e.date)
          .filter((d) => d !== "Date unknown")
          .sort()
          .at(-1) ?? "Date unknown",
      openQuestion: i.instructions ? "" : i.question,
    }));
}
export function demo(): State {
  let s = empty();
  const records: [string, string][] = [
    [
      "cloud-receipt.eml",
      "Date: 2026-11-01\nFrom: billing@example.test\nSubject: iCloud receipt\niCloud storage receipt: GBP 2.99. Family photo storage.",
    ],
    [
      "adobe-receipt.eml",
      "Date: 2026-09-04\nSubject: Adobe receipt\nAdobe subscription payment: GBP 21.98.",
    ],
    [
      "adobe-cancellation.eml",
      "Date: 2026-10-04\nSubject: Adobe cancellation\nAdobe subscription cancelled effective 2026-10-04.",
    ],
    [
      "old-brokerage.eml",
      "Date: 2019-03-12\nSubject: Brokerage welcome\nWelcome to your US brokerage account. No current balance is included.",
    ],
    [
      "current-account.csv",
      "date,description,amount,currency\n2026-11-02,Mortgage payment,-1250,GBP\n2026-11-03,Wise support transfer,-300,GBP",
    ],
    [
      "payslip.txt",
      "Date: 2026-10-28\nWorkplace pension deduction: GBP 185. Provider not listed.",
    ],
    [
      "policy-notice.eml",
      "Date: 2026-10-15\nSubject: Insurance premium notice\nInsurance premium notice: GBP 24. Policy document not attached.",
    ],
    [
      "meal-kit.eml",
      "Date: 2026-11-05\nSubject: HelloFresh receipt\nHelloFresh meal-kit receipt: GBP 32. Next delivery subject to your plan.",
    ],
  ];
  for (const [name, text] of records) s = ingest(s, name, text);
  const home = s.items.find((i) => i.title === "Home payment")!;
  Object.assign(home, {
    status: "confirmed",
    essential: true,
    recipient: "Alex",
    instructions:
      "Monthly home payment. Contact our lender using the details in the mortgage folder. Confirm the next due date before taking action.",
  });
  return s;
}
