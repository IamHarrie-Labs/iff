# Iff

## One line

Iff turns your statements and emails into a plan someone you trust can follow if you can't: in hospital, without your phone, stuck abroad.

## Problem

Most households run on what one person remembers: which payments matter, who depends on a transfer, which subscription holds the family photos. When that person can't answer, the people stepping in start from nothing.

## What it does

1. Add a few statements and emails. Built-in rules make a first pass.
2. The Iff agent then reads each new record itself, raises what the rules missed, and drafts answers. Every finding it adds must quote the record word for word; the server refuses anything it can't find.
3. You answer, edit or use the agent's draft. Only you can confirm. The agent can suggest but can't confirm.
4. Share the plan with a private link. Your trusted person sees only the confirmed items assigned to them, never your records. Turn the link off at any time.

## How it uses Agent-Native

- One set of actions serves the UI and the agent: iff-workspace, iff-import, iff-suggest, iff-draft, iff-update, iff-note, iff-handover and iff-export.
- Context: view-screen gives the agent the open finding, its evidence and any draft, the visible list or the current plan. navigate lets the agent open a finding or a plan on the user's screen while it talks about it.
- Boundaries in code, not just the prompt: confirming is accepted only from the app (`caller: frontend`); sharing, export and deletion are UI-only actions (`agentTool: false`); checking actions are `retrySafe` so the agent corrects bad arguments instead of failing.
- Data per person in SQL; the agent's edits refresh the UI through the shared action queries.
- `agent-native doctor` passes clean.

## Trust

- Private workspace per person. A no-sign-up sample workspace, deleted after 24 hours.
- Passkey accounts: no email, no password. Only the public key is stored.
- Share links stored as fingerprints, expiring, revocable, not indexed.
- Download or delete all your data from the account menu.
- No ad or analytics trackers. Privacy notice, terms and a plain "how we handle data" page that also lists what isn't done yet.

## Honest limits

No live bank or inbox connection, no PDF or OCR yet, and Iff can't move money or act on accounts. Findings from old records are clues, not proof of current balances or ownership. Passkey sign-in needs a deployed HTTPS domain and hasn't been tested end to end yet.

## What's next

Let the trusted person ask Iff questions answered only from their plan. PDF statements. A "first two weeks" view of what's due soon and still has no instructions.

## Links

- Live app: https://iff-beta.vercel.app
- Demo video: https://clips.agent-native.com/share/lptrvRSWuuZw
- Repository: https://github.com/IamHarrie-Labs/iff
