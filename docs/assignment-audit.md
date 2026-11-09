# Assignment 6 requirement audit

Reviewed November 8, 2026 (America/Chicago) against the supplied four-page LifeHarness
assignment brief, the current code and actual verification results.

**Verdict: the technical harness requirements are implemented and supported by tests.
The complete assignment is not finished until the student records and submits the demo.**

| Assignment requirement                              | Assessment                                        | Evidence and limits                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two readable, protected data sources                | Meets technical requirement                       | academic.json and jobs.json are synthetic, readable by Claude; hook denies source writes. Human task progress is stored separately.                                                                                                                                                                                        |
| Short AGENTS.md and on-demand context               | Meets technical requirement                       | Focused 23-line instructions, separate context files, explicit launcher injection. Current interactive /context all listed the morning skill; /memory listed AGENTS.md. No project CLAUDE.md exists.                                                                                                                       |
| Morning skill chosen without naming it              | Meets technical requirement                       | Current isolated real-Claude test with only “Good morning” invoked morning-check-in, read both sources, notes and human progress, respected an already-done task and asked two questions.                                                                                                                                  |
| Propose, wait for agreement, save plan and notes    | Implemented; positive save previously live-tested | Prior real CLI proposal/refusal/approval test wrote neither file before agreement, then wrote plan and notes after agreement. Current revision was re-tested for natural discovery/read/no-write behavior; that new audit did not repeat a positive multi-turn save. See claude-verification.md for the scope of each run. |
| Local page shows the day and updates after check-in | Meets technical requirement                       | /board shows task progress; Schedule drawer shows confirmed priorities/timeline. Current production browser test observed saved-plan refresh in about 3.41 seconds. The landing page is an entry point, not the day view.                                                                                                  |
| Hook blocks changes to original data                | Meets technical requirement                       | Current npm run test:hook:live produced a real PreToolUse denial after Claude Read→Write in a disposable fixture; SHA-256 unchanged. Policy tests also cover path traversal/links and disallowed tools.                                                                                                                    |
| Notes as memory                                     | Meets technical requirement                       | Generated notes read in the current real-Claude test, with recorded carryover used in its response; skill updates notes after a confirmed plan save.                                                                                                                                                                       |
| Iterative process                                   | Evidence available                                | Planning choices, multiple implementation stages, UI critique/redesign, homepage request and separate commits demonstrate iteration. The student should explain those decisions; commit count alone does not establish compliance.                                                                                         |
| 3–5 minute demo in class Slack #general             | Not completed/verified                            | No recorded video or Slack post was supplied or created in this task.                                                                                                                                                                                                                                                      |
| Classroom submission of Slack-post link             | Not completed/verified                            | No Classroom submission was supplied or performed. Code upload is not the required submission.                                                                                                                                                                                                                             |

## Fresh checks from this audit

- npm run check: type generation, TypeScript, 24 unit tests and production build passed.
- Eight current production-browser tests passed: navigation, filtering, persistence,
  drag/drop, timer, saved-plan refresh, stale/error handling, job tracker and dialogs.
- Real Claude “Good morning” test in an isolated fixture: skill selected; academic,
  jobs, human-progress and prior-notes files all read; zero writes before agreement.
- Real Claude hook denial in an isolated fixture: passed, source hash unchanged.
- Current interactive context/memory commands verified skill and AGENTS.md presence.
- Removed an unnecessary Chrome integration prompt by adding --no-chrome to the
  dedicated planner launcher. Regression test passed; interactive startup reached
  the normal prompt directly. This does not change the user's global browser settings.
- Corrected demo narration: human task progress is editable; original source data
  remain read-only.

## What the student still needs to demonstrate

1. Run npm run planner:demo alongside /board?date=2026-11-10. Open Schedule so the
   viewer can actually see the day's plan, rather than staying on the landing page.
2. Show /context all and /memory, briefly explain always-loaded versus on-demand context.
3. Type Good morning without naming the skill; answer its questions, review a proposal,
   decline once if time permits, then explicitly approve. Show plan and notes saved
   and the Schedule drawer updating without reload.
4. Ask to move a protected source event. Distinguish model refusal from a real hook
   denial; the live hook fixture test is available to prove enforcement safely.
5. Explain what Claude decides and what code enforces. Briefly describe an actual
   iteration, such as task-board redesign or the fresh-clock fix.
6. Record a 3–5 minute side-by-side demo, post it in class Slack #general and submit
   the post link in Google Classroom.

## Process/authorship caveat

The brief's development steps say to have Claude write the skill and page. This
project's implementation was primarily authored with Codex, while the actual daily
planning harness genuinely runs in Claude Code. Do not claim Claude authored code
it did not. For the most faithful process demonstration, personally review the
preferences/context/skill with Claude, make a real preference change if needed and
explain the tool roles honestly. The instructor's interpretation of authorship
wording and the final demo determines grading; passing tests is not a grade guarantee.

Weather, news, transit and automated job discovery are optional examples in the
brief; the listed requirements do not demand those features or deployment.
