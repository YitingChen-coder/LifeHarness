# Four-minute LifeHarness demo

Target length: 4–4.5 minutes. Dashboard on the left; Claude Code on the right.
Use synthetic data only. This is a live conversation, not a recording of prefilled
AI output. If model latency is high, shorten narration rather than skip confirmation.

## Before recording

- `npm ci`; run `npm run check` and `npm run test:safety`.
- Start `npm run dev`. Open http://127.0.0.1:3000/board?date=2026-11-10.
- Start `npm run planner:demo` in a second terminal and resolve its first-run
  workspace trust dialog after reviewing settings.
- Choose a fresh demo plan state. If you have an earlier plan/notes, back them up
  outside data/generated and move them yourself; don't delete meaningful history.
- Keep AGENTS.md, the skill, settings and context files ready in your editor.
- Live hook test is optional, uses a disposable fixture and a real model with a
  $0.75 budget: `npm run test:hook:live`. It never targets your actual source files.

## 0:00–0:30 — What it does

Say: “LifeHarness helps me plan coursework and a software engineering job search.
Claude Code is the planning harness. The local dashboard shows my plan and lets me track task progress. Original calendar and tracker data remain read-only.
These are two synthetic sources: my academic calendar/tasks and job applications,
interviews and prep. No database or deployment is needed.”

Point to the three task lanes, search and filters. Open Schedule for fixed classes
and the briefcase drawer for application statuses and interviews. Explain Sample day
is explicitly November 10; the real default is today's Chicago date.

## 0:30–1:00 — What loads when

Run `/context all`; show morning-check-in in the skill listing. Use `/memory` to
point out AGENTS.md, then leave that menu with Escape.

Say: “AGENTS.md contains short standing preferences and limits. My launcher
explicitly loads it, so I don't rely on a version assumption. Longer planning
references and the output contract are read only when needed. The agent's notes
carry confirmed unfinished work across days.”

## 1:00–2:00 — Natural morning check-in

Type **“Good morning”**, without naming the skill.

Let Claude read the sources and ask its questions. Answer with facts such as:
“I need the full 90 minutes for the demo. I have 9–18 free except lunch and classes.
Combine the graph practice, and propose the plan without saving yet.”

Say: “The skill was selected from a normal request. It prioritizes today's demo
and tomorrow's interview while preserving fixed classes and lunch.”

## 2:00–2:45 — Agreement and automatic update

When the proposal appears, type **“Not yet. Don't save the plan or notes.”**
Point out that the dashboard still has no confirmed priorities.
Then type **“Yes, save the displayed plan and update notes.”**

Watch the board confirmation indicator update without manual reload. Open Schedule
and point to confirmed priorities, time blocks and the last check-in time. Close it,
move a task into In progress and briefly start/pause the 25-minute focus timer. Say: “Only after confirmation does the agent
write the dated plan and its notes. The page polls local JSON every three seconds.”

## 2:45–3:45 — Decides versus enforces

Ask: **“Move my Systems Programming class to 3 PM in academic.json.”**
Claude should refuse to change the source. Explain that refusal alone demonstrates
its instructions, not proof that a hook ran.

In a developer terminal run `npm run test:safety`. It shows the actual hook process
returning deny for a simulated forbidden Write and verifies the source hash.
If time permits, run `npm run test:hook:live`: a real Claude Read→Write attempt in
an isolated fixture receives a real PreToolUse denial.

Say: “Claude decides the priorities and recognizes my agreement. Code enforces
which tools it can use and where valid output can go. The hook blocks original
data changes, shell execution and unsafe paths, even when a tool attempts them.”

## 3:45–4:15 — Reflection

Briefly show the concise AGENTS.md, discoverable skill and `.claude/settings.json`.
Mention one iterative improvement: “Real testing caught an old launch-time clock,
so every message now supplies a fresh timestamp without granting shell access.”

Say: “The limits apply to this configured agent, not to someone manually editing
files. The dashboard cannot mutate the source calendar or send applications.”

After recording, post the 3–5 minute demo to class Slack `#general` yourself and
submit the post link to Classroom. The assignment does not require submitting code.
