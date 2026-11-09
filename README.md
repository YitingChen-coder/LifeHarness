# LifeHarness

**A little structure. A clearer day.**

A local-first daily planning harness for UChicago MPCS 51238, Design, Build, Ship.
Move work through To do, In progress and Done on a focused task board.
Claude Code helps you plan; the schedule drawer shows the day you confirm.
Original calendar and job-search data stay protected.

![LifeHarness sample day dashboard](docs/images/dashboard.png)

## Start locally

Requires **Node.js 22+**, npm, and **Claude Code 2.1.295+** with a working login.
Tested with Node 24.12.0 and Claude Code 2.1.312. Get Claude Code from the
[official setup guide](https://code.claude.com/docs/en/quickstart), then log in with
`claude auth login` if needed. No model API key is stored in this project.

```bash
git clone https://github.com/YitingChen-coder/LifeHarness.git
cd LifeHarness
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. In a second terminal in the same folder:

```bash
npm run planner
```

Review and accept Claude's first-run trust dialog for this project. Then say
**“Good morning”** or **“Plan my day”**, answer one or two questions, review the
proposal and explicitly agree to save. The page updates automatically, normally
within three seconds and within five seconds in the browser integration test.
Declining a proposal saves neither a plan nor notes.

The dashboard does not run Claude or spend model credits. The planner uses your
Claude subscription/account. Generated plans, notes and task progress stay local and are gitignored.

## Try the sample week

All courses, task records and company applications are **synthetic**. The sample
week is November 9–15, 2026. A fresh checkout contains no preconfirmed plan.
The dashboard defaults to the real current date in **America/Chicago**.

1. Click **Sample day** in the dashboard (November 10), or open
   http://127.0.0.1:3000/?date=2026-11-10.
2. Start `npm run planner:demo` in your terminal.
3. Say “Good morning”, answer the questions and confirm the displayed plan.
4. Open **Schedule** to see confirmed priorities and time blocks. The board shows
   the last check-in and keeps completion consistent across dates.

For a different date, use `npm run planner -- --date 2026-11-12` and select the
same date in the page. November 12 includes a fixed class/interview conflict.
A demo date changes the planning date, never the real confirmation clock.

Default preferences: work 09:00–18:00; lunch 12:00–13:00; fixed classes/interviews
stay fixed even outside that window. Hard deadlines and interview prep come first.
Move tasks by dragging the grip into another column, choosing a status, or using
**Start task / Mark done / Reopen**. Changes persist independently of source files.
You can also confirm completed tasks through Claude. A newer explicit manual update
wins over an older plan; newer confirmed completion is remembered across dates.

## Use the task board

- **All tasks / Coursework / Job search:** switch domains; search task names,
  course codes, course names and companies. Deadline filtering narrows the board.
- **Focus now:** start a 25-minute timer, pause/resume or reset it. The deadline
  survives a browser reload. Finishing a timer never silently completes the task.
- **Task title:** open details with full deadline and a status selector.
- **Schedule:** view fixed classes, interviews, conflicts and a confirmed AI plan.
- **Briefcase icon:** open all job applications/statuses and upcoming interviews.
- **Plan with Claude:** copy the selected-date terminal command and run it; this
  button does not pretend to be a browser-hosted AI conversation.

Desktop columns scroll independently. On small screens the lanes stack vertically.
Task progress is stored in `data/user/task-state.json` (local, gitignored), which
Claude may read but cannot edit. The timer stays in browser storage. Neither changes
original academic/job-search records or sends messages/applications.

## What loads when

| Component                                       | When and why                                                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                     | Launcher explicitly appends these short standing rules every new session. Do not assume another Claude version auto-loads it. |
| `context/planning.md`                           | Longer course/career references, read when planning needs them.                                                               |
| `context/output-format.md`, `src/lib/schema.ts` | Exact output contract, read before saving.                                                                                    |
| `.claude/skills/morning-check-in/SKILL.md`      | Trigger description is discoverable; full skill loads when Claude selects it from a natural morning request.                  |
| `.claude/settings.json`                         | Registers the source-protection hook and a fresh clock hook.                                                                  |
| `data/user/task-state.json`                     | Human progress, read at check-in and protected from agent writes.                                                             |
| `data/generated/notes.json` and dated plans     | Confirmed carryover and memory, read on later check-ins.                                                                      |

Run `/context all` inside the launched session to inspect context and the skill
listing; `/memory` identifies loaded instruction files. There is no project
CLAUDE.md. The installed version also displayed AGENTS.md in its memory list;
explicit launcher injection remains the portable guarantee.

## Decides versus enforces

**Claude decides:** which questions to ask, how to prioritize and distribute work,
what can realistically fit, and whether your message is explicit agreement.

**Code enforces:** the dedicated launcher exposes only Read, Glob, Grep, Write,
Edit and Skill, disables MCP servers, and rejects arbitrary CLI overrides. A
wildcard `PreToolUse` hook denies shell/code execution, other skills/tools, Edit,
source/config/app writes and unsafe paths. Only complete, validated dated plan
JSON and notes JSON can be written under `data/generated/`. Plans must preserve
fixed events and reference real source IDs. Tasks cannot overlap lunch or another
block. A `UserPromptSubmit` hook supplies the actual clock each turn. Hook failures
block tool calls rather than silently allowing them.

The boundary applies to this configured Claude session. It is not an OS sandbox
against you or external software. The `confirmed` flag is not independent proof
of human agreement; the skill's confirmation behavior has been tested separately.
Plan and notes are two separate writes: the skill reports partial save failures.
Use `npm run planner`, not an unrestricted Claude session, for day-to-day planning.
Development and Git commands run in a separate developer terminal.

## Commands and tests

| Command                      | Purpose                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                | Local dashboard on loopback port 3000                                                                        |
| `npm run planner`            | Real-date restricted Claude planner                                                                          |
| `npm run planner:demo`       | Planner for November 10, 2026                                                                                |
| `npm run planner -- --check` | Inspect launcher configuration without starting Claude                                                       |
| `npm test`                   | Schema, dates/DST, storage, state retention, policy and launcher tests                                       |
| `npm run test:safety`        | Run the actual hook process with a simulated forbidden Write; verify source SHA-256 unchanged; no model cost |
| `npm run test:hook:live`     | Optional real Claude Read→Write test in a disposable fixture; budget capped at $0.75                         |
| `npm run test:e2e`           | Build and run seven headless browser tests against a production server on port 3100                          |
| `npm run check`              | Generate types, typecheck, unit tests and production build                                                   |
| `npm run format:check`       | Check source/document formatting                                                                             |
| `npm run build && npm start` | Production local dashboard                                                                                   |

Before running browser tests for the first time:

```bash
npx playwright install chromium
npm run test:e2e
```

Tests back up and restore their generated-plan and human-progress fixtures. They do not
change protected source files. For an existing compatible Chromium binary, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Live-model checks are
optional and require login; normal unit/browser tests do not call a model.

Read [real Claude verification evidence](docs/claude-verification.md), the
[verification ledger](docs/verification.md), [architecture](docs/architecture.md)
and the [four-minute demo script](docs/demo.md).

## File map

```text
AGENTS.md                  Short daily-planning rules
context/                   On-demand planning/output references
.claude/skills/             Discoverable morning check-in skill
.claude/settings.json       PreToolUse and UserPromptSubmit hooks
data/sources/              Protected academic.json and jobs.json
data/generated/            Local YYYY-MM-DD.json plans and notes.json
data/user/                 Human-owned task-state.json progress
scripts/                   Restricted launcher and safety checks
src/app/                   Dashboard and read-only GET /api/dashboard
src/lib/                   Schemas, Chicago dates, store, view/state helpers
tests/                     Unit/security and browser integration tests
docs/                      Architecture, evidence and demo instructions
```

The API accepts only an optional `date=YYYY-MM-DD`, validates it, reads files
freshly and sends `Cache-Control: no-store`. `GET /api/dashboard` remains read-only.
A separate `POST /api/tasks` accepts only `{id, status}` for a known task, validates
same-origin loopback requests and atomically saves human-owned progress. There is
no endpoint to modify sources or automatically approve AI-generated plans.
The browser polls every three seconds. Missing/invalid source files produce warnings;
if a previously valid view exists it is retained and labeled stale. Invalid plans
retain the last valid in-browser plan. No plan is displayed as confirmed on first run.

## Troubleshooting

- **No plan:** choose the same date in Claude and the dashboard, and explicitly
  confirm the displayed proposal. Sample data alone never counts as a check-in.
- **Claude cannot start:** check `claude --version` and `claude auth status`.
  Version 2.1.295+ is required for fail-closed hook errors. Start through the launcher.
- **Hook error:** run `npm ci`, then `npm run test:safety`. Do not disable hooks to
  bypass a failure. The hook requires local Node and the installed tsx dependency.
- **Plan rejected:** read the denial. Common causes: missing fixed classes,
  mismatched date/filename, unknown source IDs, task overlap or lunch work.
  Ask Claude to propose a corrected plan and confirm it before writing.
- **Broken source warning:** inspect and repair the local JSON yourself in a
  developer terminal; the planning session intentionally cannot edit it.
- **Port 3000 in use:** `npm run dev -- --port 3001`, then open that local URL.
- **Connection errors mentioning 127.0.0.1:7897:** a shell proxy may point to an
  inactive local proxy. Start your proxy or remove those proxy settings for the
  affected command. The app does not require or modify proxy/account settings.
- **First-run trust prompt:** review `.claude/settings.json`, the skill and hook
  before trusting the folder. No permission-bypass flag is required.

No deployment is needed. For the assignment, record the dashboard and Claude Code
side by side, post the 3–5 minute recording yourself in class Slack's `#general`,
and submit that post's link in Classroom. This project does not post or submit for you.
