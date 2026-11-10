# Iff local prototype

## Run

Use Node 22.22+ and pnpm. Run `pnpm install`, then `pnpm dev`. Open `/home`. The root route uses the framework's local authentication redirect. `.env` contains `AUTH_DISABLED=true` for local development only.

Start with **Explore a sample life**, then open **Support transfer**, confirm its purpose, add instructions, assign **Alex**, and inspect **Handover**. Adobe's receipt and later cancellation should resolve to one inactive finding.

## Implemented

Agent-Native action-backed imports, discoveries, evidence review, editable context, recipient filtering and text export. SQL persistence through the framework's PGlite development database. Native agent chat at `/chat` uses the same actions. Configure a model through Agent settings to use live AI chat; the discovery screen itself uses deterministic patterns and needs no model key.

## Current limits

This is deliberately a single-workspace local prototype. Domain actions refuse production and require `AUTH_DISABLED=true`. Recipient views are owner previews, not authenticated sharing. Do not deploy until per-person ownership and recipient sessions are implemented.

Imports accept small UTF-8 CSV, TXT and unencoded plain-text EML. Recognition currently uses a documented set of English-language service/category patterns, not general worldwide account discovery. A source date is the first ISO date found; unknown dates stay unknown. No statement balance or recurring-total calculations are presented. No live Gmail, bank integration, OCR, email sending or payment movement.

## Verification

Domain checks: `node --test tests/iff-domain.test.mjs`. Template checks: `pnpm typecheck`, `pnpm agent-native:doctor`.

For Iff local development, create .env containing AUTH_DISABLED=true. The domain actions refuse production use until per-person ownership and authenticated recipient sessions are implemented.

## Verification result — November 9, 2026

- Five domain tests pass with Node's test runner.
- Direct TypeScript check passes: `node node_modules/typescript-7/bin/tsc --noEmit`.
- Agent-Native doctor reports no findings.
- npm dependencies installed successfully; package-lock.json records the resolution.
- Native framework typecheck launcher has a Windows path quoting problem with this workspace. The project script invokes its underlying Node entry points directly. Route generation also prints production configuration warnings for this local-only configuration; no production deployment was attempted.
- Browser smoke test is **not passed**. The development server announced port 8080, but HTTP requests returned 500 after Vite module-runner transport timeouts loading framework dependencies (crossws, react-router, and Nitro runtime modules). Native browser navigation also timed out. Externalization and an in-process Nitro runner did not establish a working page; these experiments were removed. The failed development server was stopped.
- No live model calls, authenticated recipient sessions or external invitations were tested. Model configuration is still required for native AI chat.

Next engineering task: isolate the framework runtime failure with an untouched template on this Windows/Node setup, then verify the full sample-import → confirm → handover flow in a browser. Do not present the current UI as end-to-end verified.

## Later verification update

The local browser workflow has now been exercised successfully: sample discovery, receipt/cancellation evidence, confirmed family-support instructions, recipient handover updates, a real sample CSV upload, and a manual household note. Mobile (375 px), tablet (768 px), and desktop (1280 px) checks found no horizontal overflow. The selected geometric logo is applied as SVG artwork; screenshots are in design/verification.

The final shared iff-export HTTP action returned the actual filtered guide and saved it to design/verification/iff-handover.txt. Browser download automation stalled; the export control has been hardened and a Copy guide alternative added, but those final browser controls still need their last verification.

Seven domain tests pass, the framework doctor reports no findings, and the direct TypeScript check passes after restoring an icon package's missing declaration. Native model connection and inference remain untested. Public deployment, authenticated recipient sharing and contest submission have not happened.

Documentation coverage and release gaps are recorded in DOCS-REVIEW.md. Current section and selected discovery are now included in semantic navigation and view-screen.

Runtime configuration retains Vite 8, explicit prebundling for react-is/style-to-js, and a server-only native resolver for react-router/crossws to avoid the observed transform hangs. Cold compilation can still be slow. The hidden local preview process writes logs and its PID under .agent-native/iff-preview/. If a server-side hot reload wedges PGlite cleanup, restart that preview process cleanly rather than starting another process on the same data directory.
