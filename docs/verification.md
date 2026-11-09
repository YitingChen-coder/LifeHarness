# Verification ledger

## Stage 01 — bootstrap

- Next.js 16.4.5 installed; npm audit: zero vulnerabilities.
- Production build and TypeScript check passed; GET / returned HTTP 200.
- Git history restored from origin/main; normal authenticated Git push works
  with per-command HTTP proxy override. No account settings changed.

## Stage 02 — architecture

- Reviewed design against the approved plan and ten-stage request.
- Ruling: work in the supplied freshly restored checkout, preserving main history;
  no additional worktree because this directory is the requested deliverable.
- Ruling: disable Next's automatic agentRules generation to keep AGENTS.md short
  and specific to the daily planner.
- Tool access and schema enforcement are technical controls; conversational
  agreement is a skill rule and will be reported separately from hook tests.

## Stage 03 — synthetic sources

- Parsed both JSON files and verified unique record IDs.
- Academic data: three MPCS courses, five classes, seven tasks.
- Jobs: five fictional companies, two interviews, five preparation/follow-up tasks.
- November 9–15, 2026 sample week includes a Thursday interview/class conflict.
- Generated directory has no fabricated user-confirmed plan.

## Stage 04 — context and contracts

- Test-first: schema suite initially failed because schema/date modules were absent.
- Four behavior tests now pass: valid fixtures, duplicate/dangling source records,
  date traversal/impossible dates, Chicago DST boundaries, confirmation field,
  task overlap/lunch/window and structured notes. TypeScript passed.
- AGENTS.md remains short; longer planning and output contracts load on demand.

## Stage 05 — morning skill and launcher

- Test-first launcher check failed before implementation; now five tests pass.
- Launcher rejects arbitrary CLI switches, validates demo dates, explicitly appends
  AGENTS.md and exposes only Read/Glob/Grep/Write/Edit/Skill; MCP servers disabled.
- Claude Code 2.1.312 is installed and logged in. Runtime requires >=2.1.295.
- Skill has discoverable trigger metadata, 1–2 questions and explicit save agreement.
- Static contract verified here; actual /context and model behavior deferred to
  stage 09, not claimed as passed. Launcher intentionally requires stage 06 hook.

## Stage 06 — source protection

- Test-first security suite failed before hook modules existed; seven tests now pass.
- Hook subprocess denies malformed input and an actual source Write payload.
- Policy tests cover source/config/app writes, traversal, symlink target and parent,
  hard links, unknown tools, incomplete/invalid plans and unknown references.
- Approved whole-file plan/notes payloads pass; protected file hashes stay unchanged.
- Wildcard PreToolUse uses onFailure:block (supported since Claude Code 2.1.295).
- Edit is intentionally blocked: complete JSON must be validated before each write.

## Stage 07 — read-only API and polling

- Test-first store tests failed before store.ts existed; all nine tests now pass.
- Store re-reads saved files, rejects symlinks and invalid/traversal dates, distinguishes
  no plan from bad plan, and preserves usable sources when another source is invalid.
- Live GET /api/dashboard?date=2026-11-10 returned 200 with three courses and no plan;
  impossible date returned 400; POST returned 405.
- Client polls every three seconds, aborts stalled reads, retains last good content
  and labels read/connection warnings. Browser behavior will be checked in stage 09.

## Stage 08 — responsive dashboard

- Eleven tests passed; production build succeeded, including dynamic GET route.
- Independent headless Chromium rendered the sample day at 1440x1100 and 390x844;
  screenshots visually reviewed; no horizontal overflow at either size.
- Check-in button opened correct date-specific terminal instructions; Got it closed it.
- UI includes fixed calendar, confirmed priorities/status, academic deadlines,
  interview prep, next interview, application pipeline/details, local-data state,
  conflict warnings, explicit demo selection and three-second refresh indication.
- Browser connector had no available sessions; checks used an isolated headless
  browser with no personal Chrome profile. Screenshots remain local in artifacts/.

## Stage 09 — integration and review

- Real Claude natural prompt selected the skill; answered questions → proposal →
  declined save → explicit approval produced expected behavior. No files before
  agreement; two allowed writes after. Detailed evidence: claude-verification.md.
- Real Read→Write source attempt was denied by PreToolUse; SHA-256 unchanged.
  Isolated repeat through npm run test:hook:live also passed (real model, $0.75 cap).
- Added UserPromptSubmit clock context after detecting stale launch-time metadata;
  real retry used its fresh timestamp identically in plan and notes.
- Thirteen unit tests and four production-server browser tests passed. File-to-view
  refresh ~3.4s; keyboard focus wraps/returns; no overflow at 320/390/768/1440px.
- Independent reviewer found two P2 issues: transient source errors discarded old
  data, and task slices hid remaining records. Added failing tests first, then fixed
  source retention with stale labels and task-list expansion. Whole suite green.
- Modal keyboard test first failed; native modal plus explicit boundary wrap fixed it.
- Generated test plans/notes copied to ignored artifacts then removed from runtime
  data, leaving an honest no-check-in initial state. Protected source files unchanged.

## Stage 10 — delivery

- Added complete English README, first-run screenshot and a four-minute demo script.
- Documented actual context/skill/hook evidence, cost-bearing optional tests, safety
  boundaries, sample dates, completion updates and troubleshooting.
- Formatted implementation and tests for reviewability; formatting check passed.
- Ignored Next-generated declarations; typecheck now runs next typegen so it works
  in a fresh checkout. Disabled the development overlay for a clear demo view.
- Added a failing missing-date-argument regression test, then fixed the launcher;
  all thirteen unit tests passed again.
- Final npm run check passed: type generation, TypeScript, 13 tests and production build.
- Final four Playwright tests passed against the production server. Measured
  file-to-browser refresh 3390ms. Source SHA-256 check passed; no generated test
  plans or notes remain in runtime data. Dependency audit reported zero vulnerabilities.
- Final independent review findings were fixed in stage 09 with regression tests;
  no deferred reviewer findings remain. Existing main history preserved, no force pushes.
- User-authorized integration: ten sequential verified phase commits to main,
  with a push after each. No additional merge/PR approval step is needed.

## Task board redesign — checkpoint 1

- Selected visual: third displayed concept, saved as docs/design/task-board-target.png.
- Added persistent human-owned task state independent of immutable sources and AI plans.
- API accepts known IDs and enum statuses only, requires same-origin loopback JSON,
  serializes concurrent edits and atomically replaces state; rejects linked state files.
- Board model exposes all 12 tasks with searchable course/company context and due filters.
- Newer human progress overrides older AI completion; newer confirmed completion wins.
- Test-first: missing board/state modules failed initially; 17 unit tests and typecheck passed.
- Claude morning skill now reads human progress without write access to that file.

## Task board redesign — checkpoint 2

- Replaced overview cards with selected violet/graphite Focus Lane design, readable
  task titles, three independently scrollable desktop lanes and a next-event strip.
- Implemented drag handles and keyboard/touch status menus, all-task search,
  coursework/career and deadline filters, task details and schedule drawers.
- Added 25-minute focus timing with pause/reset/reload, copyable Claude launcher
  commands, confirmed-plan indication and source/stale-save errors.
- Production browser tests found normalized Next request URL differed from Host;
  updated the same-origin check to use validated public loopback Host and added regression.
- Independent review found cross-day completion regression and repeated timer-start
  reset. Added failing tests first; completion now reads validated plan history,
  and active deadlines are preserved / expired sessions restart at 25 minutes.
- 23 unit tests and typecheck passed. Five production browser tests passed, including
  drag/drop, persistence, timer, filtering, responsive widths, plan refresh (~3.4s),
  stale states and keyboard focus. Final visual/documentation pass follows.
