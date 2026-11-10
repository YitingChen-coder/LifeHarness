# LifeHarness — Assignment 6

A local calendar and task dashboard, paired with a **real native Codex terminal**
for morning planning. Record the webpage on the left and Codex on the right.

The assignment names Claude Code. The owner does not have it and explicitly chose
Codex as the platform substitution; the remaining workflow follows the assignment.
This is not a claim that the instructor approved the substitution.

## Run the assignment workflow

Requires Node.js 22+, npm, and Codex CLI **0.160.0+** signed in with ChatGPT.
[Install Codex](https://developers.openai.com/codex/cli/) and `codex login` if needed.
No API key, database, deployment or website login is required.

Start the local webpage:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000 and click **Open calendar**. Keep that browser on the left.
In a second terminal opened in this project, run:

```sh
npm run planner:demo
```

This selects November 10, 2026. Select the same day on the calendar. For the actual
day use `npm run planner`; for another date use `npm run planner -- --date YYYY-MM-DD`.
Review/trust the authored project hooks through `/hooks` on first launch. Normal
launches never bypass hook trust. Skip the optional CLI update prompt to keep the
tested version; no global upgrade is required by this project.

In the **native Codex terminal**, say **Good morning** or **Plan my day**:

1. Codex discovers/reads the morning skill and the two protected sources, progress
   and prior notes. It asks one or two questions and waits for your answers.
2. It proposes priorities and time blocks around fixed commitments and lunch.
3. Ask for a revision or decline: plans and notes must stay unchanged.
4. Explicitly agree to the displayed proposal. Codex saves the validated plan,
   then memory. The calendar automatically refreshes within five seconds.

The default webpage is a display and human task interface; it does **not** call a
model or accept AI plan confirmations. **Terminal check-in** opens a nonmodal guide
with the date-specific command. Close it for a clean split-screen recording.

## What the harness contains

| Assignment element     | Implementation                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Two readable sources   | data/sources/academic.json and jobs.json; realistic synthetic week November 9–15.    |
| Short standing context | AGENTS.md, automatically discovered and explicitly included by the launcher.         |
| On-demand references   | context/, schemas, sources and the full morning skill.                               |
| Natural morning skill  | .agents/skills/morning-check-in/SKILL.md, picked from an unnamed natural request.    |
| Native protection hook | .codex/hooks.json → scripts/protect-data.mjs (PreToolUse).                           |
| Actual save clock      | Native UserPromptSubmit clock hook; demo date never substitutes for real timestamps. |
| Cross-day memory       | data/generated/notes.json; only after agreement and a successful plan save.          |
| Local UI               | Calendar, task progress, deadline filters, career drawer and focus timer.            |

The sample sources are read only to the planning session. The agent may suggest
changes but cannot move events, edit important data, send messages or apply for jobs.

## Show what loads when

In native Codex, `/status` shows the model, directory, permissions and
**Agents.md: ../../AGENTS.md**. `/skills` lists the discoverable morning skill;
`/hooks` shows enabled lifecycle enforcement. Do not manually select the skill
before the natural-trigger demonstration.

```sh
npm run planner:context
```

This uses native `codex debug prompt-input` without a model call and prints a
redacted summary: short rules present, skill metadata visible, full skill/reference
bodies not preloaded. It does not dump private account/user context. Claude's
`/context` is not assumed to be a Codex command; these are the verified substitutes.

## Decisions versus enforcement

Codex decides questions, priority order, time distribution and whether the user
has agreed. A prompt alone cannot guarantee compliance. Native PreToolUse permits
only curated reads and whole validated JSON writes through the helper. It denies
arbitrary commands, patches, MCP/subagent tools and original-data edits. Code checks
source IDs, fixed events, Chicago dates, task hours, lunch, links and output schemas.

The launcher starts in data/generated under the native workspace sandbox, disables
MCP/plugins/web/escalation, cleans inherited parent-session permission variables,
and probes that protected source write-open fails. Shell heredoc temporary files
stay in data/generated/.planner-tmp; no extra write root or /tmp access is granted.
An audit record contains decision/reason/command hash, not personal command contents.
Plan/notes remain contingent on conversational agreement; the hook does not
independently authenticate human consent. A notes failure is reported separately.

The default browser has no AI plan write endpoint. The human Tasks interface writes
only data/user/task-state.json, never source JSON. Current completion state is shared
with the calendar. Sources, generated plans, notes and progress remain local.
Generated/user data, hook audits and local verification logs are gitignored.

## Verify and demonstrate

```sh
npm run check              # Types, unit/security tests and production build
npm run test:e2e           # Default assignment UI; optional browser cases skipped
npm run planner:context   # Redacted native context evidence, no model usage
npm run test:safety       # Deterministic real hook process, simulated payload
npm run test:hook:live    # Actual native tool attempt + hook audit + unchanged hash
npm run test:terminal:live # Actual skill/questions/refusal/agreement/save in a fixture
npm run test:assignment:live # Same native flow plus actual calendar auto-refresh
```

Live tests use your locally signed-in Codex allowance, not API-key billing. They
inspect their copied hooks and use the hook-trust automation flag **only** inside
disposable fixtures; sandbox/approval bypass is never used. Logs are under artifacts.
Normal planner sessions still require native hook trust. For UI integration install
Playwright Chromium (`npx playwright install chromium`) or set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` to your installed testing browser.

Read [the 3–5 minute demo script](docs/demo.md), [current evidence](docs/verification.md),
[architecture](docs/architecture.md) and [requirement mapping](docs/assignment-audit.md).
Post the recording in class Slack **#general**, then submit that post's link in
**Google Classroom**. The PDF does not require a code submission or deployment.
Recording and submission are performed by the student, not this application.

## UI and troubleshooting

- Calendar opens directly; Day/Week, Today and date navigation show real fixed and
  confirmed blocks. Overlapping commitments have separate lanes. Phones default
  to Day. Tasks retains search, dragging, statuses and a 25-minute focus timer.
- No plan: match browser/terminal dates, review the proposal and explicitly agree.
- Codex unavailable: check `codex --version` / `codex login status`. This project
  requires a ChatGPT login; it does not silently switch to API-key billing.
- Denied tools: use the allowed helper and reviewed hooks; no workarounds. An
  invalid plan needs correction. Never claim a failed write succeeded.
- Heredoc failure: use the launcher, which prepares generated-only scratch space.
  Do not disable the sandbox or grant repository-wide writes.
- Full/unsafe audit: the hook fails closed. Archive/remove only
  data/generated/.hook-audit.jsonl from a development terminal, then relaunch.
- Missing/bad source JSON or failed refresh: the page shows warnings and retains
  marked last-good data. Restore the original file from a development terminal.

## Optional earlier browser mode

The embedded chat is retained as an explicit opt-in experiment, **not the assignment
demo**. Start with `LIFEHARNESS_BROWSER_CHAT=1 npm run dev` to enable it. Otherwise
/api/planner returns 404 and the UI makes no model requests. Its API validations and
unit tests remain; optional UI tests are skipped in the default suite. To test just
that retained UI, run `npm run test:e2e:browser` with no other server on port 3100.
Historical mode-specific evidence remains under docs/archive.
