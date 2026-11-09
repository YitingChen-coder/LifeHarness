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
