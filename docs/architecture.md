# Assignment-first native architecture

Primary flow: two protected sources + notes/history → native Codex morning skill →
questions → timed proposal → explicit user agreement → validated helper writes plan
and notes → local calendar/task dashboard automatically refreshes.

The browser displays the calendar, selected-day status, tasks and career information.
It does not invoke a model or confirm AI plans in default mode. Its Terminal check-in
guide supplies the date-specific native launch command. Record the browser on the
left and Codex on the right. No deployment, database, website login or API key.

AGENTS.md is short standing context, discovered automatically (shown in native
/status) and explicitly supplied by the launcher. Native debug prompt inspection
confirms its presence while full skill and planning-reference bodies are absent.
Native skill metadata enables selection from Good morning / Plan my day; actual
source/skill reads are recorded in native integration evidence.

The launcher uses data/generated as the workspace-write root, no extra write roots,
no escalation/subprocess network, disabled MCP/plugins/web and a clean parent-session
environment. Startup checks the protected source cannot be opened for writing.
Heredoc scratch files stay in data/generated/.planner-tmp, never an expanded /tmp root.

Native PreToolUse permits narrowly parsed curated reads and the helper's complete
JSON writes only. It validates dates, schemas, references, fixed events, task hours,
lunch and safe nonlinked paths. Source/config/app writes, arbitrary commands, patches
and other tool types are denied. Native UserPromptSubmit provides the actual clock.
A bounded audit stores tool IDs, decisions, reasons and command hashes. Audit failure
blocks the operation; normal launch never bypasses native hook trust.

The model interprets conversational agreement. Code validates file operations but
cannot independently prove human consent. Refusal/revision must leave plan/notes
unchanged. The helper atomically saves a plan first, then notes separately; a notes
failure must be reported honestly. Sources and human progress are never edited by AI.

The read-only week API loads all seven plans and source commitments. Chicago calendar
arithmetic handles DST dates, overlaps use lanes, and current task status follows the
shared manual/confirmed completion precedence. Three-second polling retains marked
last-good data on error. Human task actions write only data/user, not original sources.

Optional embedded browser chat remains gated by LIFEHARNESS_BROWSER_CHAT=1 on the
server; its API returns 404 by default. It is a separate, earlier architecture and
is not used as evidence for native skill selection, hooks or assignment recording.

Official native references: [hooks](https://learn.chatgpt.com/docs/hooks),
[skills](https://learn.chatgpt.com/docs/build-skills),
[commands](https://learn.chatgpt.com/docs/developer-commands).
