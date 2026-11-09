# Real Claude Code integration evidence

Verified November 8, 2026 (America/Chicago), with Claude Code 2.1.312 and a signed-in
Claude subscription. Local raw JSONL transcripts and screenshots are in the
ignored artifacts/ directory; they are not uploaded because they contain local
paths and session metadata. The table below records observed behavior, not merely
what the skill promises. The natural-language flow was a synthetic integration
test and its generated plan/notes were removed afterward to leave a clean first-run state.

| Check           | Actual observation                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context         | Launched with `npm run planner:demo`. `/context` displayed system prompt, 447 tokens of memory files and skills; `/context all` listed morning-check-in. `/memory` explicitly listed AGENTS.md. Launcher also supplies its contents through `--append-system-prompt`. No project CLAUDE.md exists. |
| Discovery       | A plain `Good morning` produced a Skill tool call for `morning-check-in`, then Read calls for both sources and a Glob for previous plans.                                                                                                                                                          |
| Questions       | Claude asked how much demo work remained and whether to combine graph practice. No Write calls occurred.                                                                                                                                                                                           |
| Proposal        | After availability answers and “do not save anything yet”, Claude displayed priorities and a timed schedule and asked for agreement. No Write calls occurred.                                                                                                                                      |
| Decline         | “Not yet. Do not save the plan or update notes” produced an acknowledgement; generated JSON files remained absent.                                                                                                                                                                                 |
| Confirm         | Explicit approval of the displayed synthetic plan produced two successful Write calls: dated plan, then notes. Both received an allow decision from the actual PreToolUse hook. Plan contained 14 blocks and 4 priorities, with fixed classes preserved and lunch free.                            |
| Fresh clock     | First run exposed a stale launch-time timestamp. Added UserPromptSubmit clock context. A real subsequent confirmation used the fresh timestamp for both plan and notes, verified equal on disk.                                                                                                    |
| Hook denial     | Diagnostic real Claude session first Read academic.json, then attempted Write with `{}`. Actual PreToolUse returned deny: `Protected file: write only dated plans or notes.json under data/generated`. SHA-256 was unchanged.                                                                      |
| Isolated repeat | `npm run test:hook:live` repeated the real Read→Write attempt in a disposable copied fixture. Received a real hook deny event and verified its source hash unchanged.                                                                                                                              |

The first diagnostic attempted Write without Read, which Claude's built-in
read-before-overwrite guard rejected before the hook. That was **not** counted as
hook evidence; the read-first test above is the relevant passing result.

## Reproduce the normal flow

1. `npm run dev`, open the dashboard, select Sample day.
2. In another terminal: `npm run planner:demo`; accept the project's first-run trust
   dialog only after reviewing the configuration. Run `/context all` and `/memory`.
3. Type `Good morning`; answer the questions; ask for a proposal without saving.
4. Decline once and observe no new plan. Then explicitly approve the displayed plan.
5. Observe the dashboard update, date-specific priorities and last check-in time.
6. Ask to move a source class. Claude should explain it cannot change sources.
   To prove enforcement independently of that choice, use `npm run test:safety`
   (no model cost), or `npm run test:hook:live` (real Claude; up to $0.75 budget).

## Enforcement limits

The hook enforces allowed tools, output paths, schemas, source references and fixed
events. Explicit human agreement is enforced by skill instructions and was observed
in this test; a `confirmed:true` field alone is not cryptographic proof of agreement.
The source protection covers calls through this configured Claude session, not a
human editing files or unrelated external software. Normal unrestricted Claude
launches are outside the supported workflow. Two output writes are not atomic;
if notes fail after a plan succeeds, the skill reports that partial result.

## Browser checks

Four Playwright tests cover date selection, fixed conflicts, all task expansion,
application details, modal keyboard focus/return, 320/390/768/1440px layouts,
file-to-view refresh, malformed plan retention, source failure retention, connection
recovery and completed task display. File-to-view refresh measured about 3.4 seconds.
Fixtures are explicitly synthetic and restored/removed after each test.

## Task-board revision

The real-model evidence above describes the original planning harness and was not
re-run as a new paid model test for the visual redesign. The revised skill also
reads human-owned data/user/task-state.json; its write remains blocked by the same
generated-output allowlist. Current UI behavior is covered by 24 unit tests and
seven production-browser tests (including persistence, drag/drop, timer, job tracker,
error retention and keyboard focus). See the latest verification ledger for results.

## Assignment audit refresh — November 8, 2026

Current real-Claude isolated audit again selected morning-check-in from only
“Good morning”, read academic/jobs/user-progress/prior-notes files, retained a done
task and asked two questions without writing data. Raw evidence is ignored under
artifacts/assignment-claude-morning.jsonl with a sanitized Boolean summary beside it.
The positive multi-turn save above is earlier evidence, not a new audit claim.
Current live hook fixture test again returned deny and unchanged source SHA-256.
Current browser suite has eight tests. See assignment-audit.md for requirement mapping
and the remaining recording/submission work.
