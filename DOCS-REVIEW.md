# Agent-Native documentation review

This records targeted coverage, not a claim that every page in the documentation site has been read.

| Area | Relevant guidance | Iff status |
|---|---|---|
| Shared actions | Define capabilities once for UI and agent | Implemented: workspace, import, note, update, handover and export actions |
| Data and sync | Read/write through action hooks; native invalidation | Implemented with useActionQuery, useActionMutation and callAction |
| Persistent data | SQL-backed domain records | Local PGlite via Drizzle; hosted database not configured |
| Agent UI | Reuse contextual native AgentSidebar | Implemented beside the domain workspace |
| Context awareness | Semantic navigation and a fresh view-screen snapshot | Added current section and selected discovery details |
| Provider credentials | Use the framework's connection/key setup | Built-in Connect AI / Custom keys retained; user connection and live inference remain unverified |
| Authorization | Explicit access checks on every dispatch surface | Current domain actions are development-only; per-person production authorization and authenticated recipient sharing remain unimplemented |
| Exports | Keep the same operation available to both surfaces | Shared iff-export action verified through HTTP; copy/download UI uses its output |

Official pages consulted for the current review:

- https://www.agent-native.com/docs/
- https://www.agent-native.com/docs/actions-overview/
- https://www.agent-native.com/docs/client-data/
- https://www.agent-native.com/docs/actions-access-control/
- https://www.agent-native.com/docs/context-awareness/
- https://www.agent-native.com/docs/environment-variables/

Also consulted the scaffold's local guides for actions, storage, security, credentials, toolkit composition, customization and context, plus installed runtime/type source during debugging. This is implementation-focused reading, not exhaustive reading of unrelated application and integration guides.

Release blockers: connect and test an actual model; implement and test per-person authorization before public hosting; verify the final browser export/copy behavior; record and submit a real public demo. Unit checks and framework code checks do not prove those user journeys by themselves.
