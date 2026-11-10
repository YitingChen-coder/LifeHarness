# Assignment-native verification — November 10, 2026

The primary flow follows the assignment's browser-left/native-agent-right structure.
Codex replaces unavailable Claude Code at the owner's request. This is the only
intended platform substitution, not evidence of instructor approval.

## Actual native session evidence

The normal `npm run planner:demo` TUI starts Codex 0.160.0 in data/generated.
Native `/status` displayed:

- Model provider: openai; user's configured GPT-6.1-Sol selection preserved.
- Permissions: Custom (workspace, never).
- **Agents.md: ../../AGENTS.md**.

Native `/hooks` displayed **PreToolUse 1 installed / 1 active** and
**UserPromptSubmit 1 installed / 1 active**. No normal-launch hook-trust bypass.
Local raw TUI capture is artifacts/assignment-tui.txt (gitignored); only redacted
facts are reported here. Claude's /context is not claimed as a Codex command.

`npm run planner:context` uses native debug prompt inspection without model usage:
AGENTS.md present (1652 bytes); morning skill metadata visible; full morning skill
and long planning-reference bodies **not preloaded**. The report does not expose
private user/account prompt context.

## Actual native morning → calendar integration

`npm run test:assignment:live` passed using inspected copied hooks and synthetic data
inside a disposable fixture, with real Codex exec/resume turns and a real browser:

| Step                                 | Observed result                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| User says only Good morning          | Native command trace reads the morning skill and both sources; asks questions. |
| Answers and requests proposal        | Timed proposal; neither plan nor notes exists yet.                             |
| Explicitly says do not save          | Neither plan nor notes is written.                                             |
| Explicit agreement to displayed plan | Native allowed helper writes the validated dated plan and notes.               |
| Existing calendar remains open       | It automatically shows native output **1446 ms** after the file write.         |
| Validation                           | 12 time blocks; generated plan and notes pass shared validation.               |
| Source integrity                     | Combined protected source hash remains unchanged.                              |

Actual confirmation timestamp: `2026-11-10T06:33:19.064Z` (00:33 Chicago).
No generated test plan is installed as the owner's day. The fixture is removed.
Local evidence: artifacts/terminal-live-verification.json, terminal-*.jsonl and
native-plan-dashboard.png. The redacted JSON summary and actual native-plan capture
are retained in docs/evidence and docs/images for review.

An earlier run exposed shell heredoc temp creation blocked by the sandbox. The fix
keeps TMPDIR/TMPPREFIX scratch in generated-only .planner-tmp, with a link-safe
startup check. No broader write root or sandbox bypass was added. A 20KB heredoc
sandbox probe and the subsequent real plan/notes save both succeeded.

## Actual hook enforcement

`npm run test:hook:live` passed: real native Codex clock read was allowed, an actual
attempted source overwrite was denied, and source SHA-256 stayed unchanged.
Independent native hook audit contains an allow record and a deny record with:

`Shell operators, substitutions and arbitrary commands are blocked`

This is not inferred merely from model refusal text. The CLI stream does not emit a
command_execution item for the rejected call, so the test checks actual hook audit
records, tool IDs and unchanged source bytes. An audit failure blocks execution.
Only inspected fixture hooks use the automation hook-trust flag; normal launches
require trust, and approval/sandbox bypass is never used.

## Default browser and regression coverage

- 40 unit/security tests pass: schemas, source references, Chicago/DST dates, safe
  paths/links, completion precedence, APIs, launch/session isolation, bounded scratch
  and default-disabled embedded model/plan mutation endpoints.
- Default browser suite: **12 passed, 5 explicitly skipped**. Skipped cases belong
  to the earlier opt-in embedded-browser flow, not the assignment's native workflow.
- The default page makes zero /api/planner requests. Both embedded GET/POST return 404. The optional guide contains the selected-date native command and leaves the
  calendar usable. Calendar refresh, navigation, tasks, dragging, timers, errors and
  card-layout geometry remain covered.
- Optional browser UI was separately opt-in tested: 4 passed. These do not count
  as native assignment evidence; the default five skipped cases remain explicit.
- TypeScript, production build and formatting pass. No CLAUDE.md is introduced.
- Independent review found the old browser demo instructions; README/demo/architecture
  were rewritten for native terminal use. No additional important security issue was
  reported in default API isolation, native policy or temporary directory handling.

Earlier browser-primary evidence is under docs/archive and is not offered as proof
of native skill selection or native write enforcement.

## Student deliverables still outstanding

The student must record the 3–5 minute demo, post it in Slack #general and submit
that post's link in Google Classroom. No recording or external submission is marked
done. Code upload/deployment is not required by the assignment PDF.

## Protected source hashes

- academic.json: `2705c5366bf93c6b2c1665846eed64dade7ccc65984e2e6f692aaf45efc39463`
- jobs.json: `ddac94ecf6b2da0fdfed1d1336f5a03f6b0d888e8be6e40eaeb8735a55f21bbe`
