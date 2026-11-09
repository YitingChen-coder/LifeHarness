# Architecture

Codex is the terminal planner. Next.js App Router, TypeScript and Tailwind render
an English landing page and task board from local JSON. No database, app login,
model API gateway or deployment is required.

Sources and previous notes → Codex morning skill → one or two questions → proposed
plan → explicit confirmation → validated generated JSON → 3-second dashboard poll.
Refusal/revision must not save a proposal. Conversation controls agreement; JSON
validation cannot independently authenticate agreement.

The launcher supplies AGENTS.md explicitly and starts in data/generated, with native
workspace-write sandbox and no extra write roots, network or escalation. Native
PreToolUse permits curated reads and the validated helper only. Native
UserPromptSubmit supplies an actual timestamp independent of the demo date.
The OS boundary protects source/config/application files even before hooks are trusted.
Hooks add output validation and deny arbitrary commands, apply_patch and MCP tools.
A startup sandbox probe aborts if a source can be opened for writing.

The helper validates full JSON, stable source IDs, real Chicago dates, offsets, fixed
classes/interviews, nonoverlapping tasks, lunch and safe paths before atomic replacement.
Symlinks and hard-linked files are rejected. Plans and notes are two separate saves:
plan first, notes second; a memory failure must be reported as partial success.

The dashboard's read API validates all files. Its separate same-origin task-state
API accepts human status updates only in data/user, which the planner cannot modify.
The newest manual/confirmed completion wins. Source files have no write API.
A wall-clock focus timer persists in localStorage. Failed refreshes retain marked
last-good state; missing/invalid files and conflicting fixed events surface visibly.

Official native behavior: [hooks](https://learn.chatgpt.com/docs/hooks),
[skills](https://learn.chatgpt.com/docs/build-skills).
