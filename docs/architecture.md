# Browser-native architecture

Next.js App Router, TypeScript and Tailwind render an English homepage, kanban and
browser planning chat. Local JSON holds two protected domains and generated output.
No database, website login, API key or hosted model gateway is required.

Browser message → guarded local API → validated source/progress/history/notes snapshot
and morning rules → native Codex app-server stdio → ephemeral read-only model thread
→ structured reply → server validation → visible proposal → explicit button →
validated atomic plan/notes writes → dashboard refresh.

The bridge checks native authentication is ChatGPT before any model call. It uses
that local account, preserving model choice, not an existing conversation/thread.
No credentials, raw process streams or private account identity are sent to the UI.
MCP servers are enumerated, disabled and rechecked; plugin, shell, subagent and web
features are disabled. No AI write capability is granted. Interactive tool requests
are rejected. Native hooks are an additional terminal-mode mechanism; browser saving
is enforced by host code and cannot be triggered by model text.

The server holds the transcript and draft in a bounded 90-minute cookie-scoped
in-memory session. The browser receives an opaque draft version. New generation
clears prior proposals; refusal writes nothing. Confirmation accepts only a draft ID,
not plan data, and adds the actual timestamp. All content is revalidated against
current source IDs and fixed events; symlinks/hardlinks and invalid paths are denied.
Plan and memory are separate atomic saves; memory failure is reported explicitly.
Duplicate confirmations are idempotent. Requests serialize per session.

The webpage exposes priorities, time blocks and proposed memory before saving.
Date-keyed component instances and request generations prevent old responses from
replacing a new date/action. Connection errors preserve input; draft schema errors
never turn into silent saves or synthetic model replies.

Read/status routes require loopback hosts. Mutation routes additionally require
exact same-origin, JSON body limits and strict action schemas. HttpOnly SameSite
cookies contain only opaque session IDs. No external-model or arbitrary file-write
endpoint exists. A separate validated task-status API writes only human progress.
The focus timer persists in localStorage and dashboard data polls every 3 seconds.

Official protocol and account behavior:
[Codex app-server](https://learn.chatgpt.com/docs/app-server).
