# Assignment 6 — 3–5 minute demo script

Use **browser on the left, native Codex terminal on the right** throughout the
main demonstration. This follows the assignment's recording structure, with Codex
explicitly substituted for unavailable Claude Code. Do not use embedded browser chat.

## Before recording

- Run `npm run dev`; open the calendar and select November 10, 2026 (Sample day).
- In the right terminal run `npm run planner:demo`. Review/trust the authored
  project hooks in `/hooks` if asked. Skip the optional global update prompt.
- Confirm model login works and no older test is running. Inspect sources only in
  a separate development terminal; keep them unchanged. Use synthetic data only.
- Preview `npm run planner:context` and `npm run test:hook:live` beforehand. The live
  test uses a disposable copy, not important personal data. No sandbox bypass.

## Record

**0:00–0:35 — Overview and deliberate choices**

“This is LifeHarness, my morning planning harness. I use synthetic coursework and
job-search data to keep the demo private. Fixed commitments take priority, tasks
fit 9–6, and lunch stays free. The calendar shows my day; native Codex runs the
check-in. I used Codex because Claude Code was unavailable.”

Point out the source files, the calendar and task/status view. Briefly describe one
iteration you made after testing, rather than presenting a one-shot generated result.

**0:35–1:10 — Explain what loads when**

Run `/status`: point to `Agents.md: ../../AGENTS.md`, working directory and permissions.
Show `/hooks` with PreToolUse active. Close the menu. You may inspect `/skills` but
**do not select** the morning skill manually before the natural-trigger test.

“AGENTS.md is short and loaded every session. The skill description is discoverable;
the full workflow, source data, notes and long references load only when needed.”

Use the redacted `npm run planner:context` report if showing context detail. Explain
that this replaces Claude's /context inspection; do not claim Codex has that command.

**1:10–2:20 — Natural morning request and a proposal**

Type **Good morning** in the native terminal without naming the skill. Show it
reading the skill and both data sources/notes. Answer its energy/availability
questions. Review the timed proposal against the visible fixed calendar commitments.

Say **“Do not save yet.”** Explain that the proposal and refusal have not changed
the saved plan or memory. If needed, request a revision and review the new proposal.

**2:20–3:10 — Agree and show automatic update**

Type **“I agree to the displayed plan. Save it and update your notes.”**
Show successful native helper writes, then the calendar updating without a manual
refresh. Point out focus blocks, preserved classes and actual last check-in time.

**3:10–4:20 — Decisions versus enforcement**

“Codex chooses questions and priorities and interprets agreement. Native hooks and
the OS sandbox enforce what tools and files it can change. Validating code checks
paths, source IDs and schedule rules. It may suggest rescheduling; it cannot edit
my original calendar.”

Ask **“Move Systems Programming in academic.json to 2 PM.”** Show the refusal. If
Codex refuses before a tool call, say so: that alone is not a demonstrated hook.

For actual enforcement, run `npm run test:hook:live` in a development terminal/tab.
It drives a real Codex tool attempt against an isolated source copy, prints the
actual hook decision and verifies an unchanged source hash. Distinguish this from
`test:safety`, which uses a simulated payload. Never count model refusal text alone
as proof of hook execution.

**4:20–4:40 — Finish**

Summarize the two sources, standing context, on-demand skill, generated memory and
native enforcement. End with the updated calendar and native terminal side by side.

## Submission checklist

- Recording is 3–5 minutes, with both webpage and native agent visible while typing.
- It explains the harness, what loads when, and decides-versus-enforces.
- It shows a natural unnamed skill trigger, questions, agreement, page update and
  a real enforcement check. State any unverified item instead of pretending it passed.
- Post the recording in classroom Slack **#general**.
- Submit that Slack post's link to **Google Classroom**.
- No code upload or deployment is required by the PDF. GitHub is the owner's extra.
- Assignment PDF deadline: Tuesday, November 10, 5:30 PM.
