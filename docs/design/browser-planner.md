# Browser-native Codex planner

Owner explicitly requests direct browser interaction and use of their current account
quota. The current chat itself cannot be called by this application. Use the native
Codex app-server and its existing ChatGPT account; reject API-key accounts to prevent
silently changing billing. Never copy credentials into the browser or repository.

Replace terminal instructions with a responsive chat and plan preview in the existing
board. Opening the panel reads local status only, with no model usage. Suggested prompts,
follow-up answers, draft revision, decline and explicit Confirm & save happen here.
Keep selected date visible and conversation scoped by browser cookie and planning date.

Next Node routes own opaque HttpOnly local sessions, transcript, draft version and
busy lock. Model calls use app-server stdio, initialized protocol, ChatGPT account check,
ephemeral read-only threads, disabled shell/MCP/plugins/subagents/web, structured output.
Provide validated sources, notes, progress, history and planning skill as bounded context.
No existing first-party thread is attached or accessed. Responses are genuine or errors;
no synthetic fallback masquerades as AI. No model can write files.

Model drafts must pass original schema, reference/path/fixed-event checks before preview.
Browser confirmations send the server-issued draft ID, never arbitrary plan JSON.
Persist plan first then notes, with actual server confirmation timestamp, atomic writes,
explicit partial-memory failure, idempotent retries and no model call on confirmation.
New messages invalidate earlier drafts; stale confirmations fail. Declining clears draft
without touching files. State has bounded in-memory lifetime; reload can restore it until
server restart. Sources remain read-only with no write endpoint.

Mutation routes require exact loopback Host + Origin, JSON, bounded bodies and enums.
Local status endpoints reject non-loopback hosts. Do not expose account email, auth tokens,
raw native protocol, tools or arbitrary config/process arguments to the browser.

Checkpoints: (1) guarded native bridge and confirmation engine/tests, push;
(2) browser interaction and responsive regression tests, push;
(3) actual connection attempt, docs, verification and review, push.

Approaches: local app-server chosen to retain logged-in Codex account and avoid API key;
a separate paid API does not match the owner's request; attaching to this chat isn't a
supported API. App-server is an independent conversation using the configured account.
