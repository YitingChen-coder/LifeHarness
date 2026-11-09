# LifeHarness Implementation Plan

> Implement inline using superpowers:executing-plans. The user has approved the design and requested ten sequential uploads.

**Goal:** A working local daily planner genuinely powered by Claude Code.
**Architecture:** Immutable synthetic sources, explicit context, discoverable skill,
fail-closed tool hook, confirmed generated plans/notes, read-only polling dashboard.
**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind 4, Zod, Node test runner.
**Spec:** docs/superpowers/specs/2026-11-08-lifeharness-design.md

## Global constraints

English artifacts, Chinese updates; America/Chicago; 09–18 task window; lunch free.
No CLAUDE.md, database, authentication or deployment. Protect all source files.
Each stage: verify, commit, push, compare remote head, report, continue.

## Review focus

Missing/malformed files must yield honest warnings; partial writes must not replace
last good browser data. Date parameters must not permit traversal. DST must use
Chicago calendar dates. Symlinks must not escape generated output. Natural skill
selection and /context require real-session evidence, not static assertions.

## Tasks and verification

- [x] 01 Bootstrap: package/config and App Router entrypoints; build, typecheck, HTTP 200.
- [x] 02 Architecture: record boundaries, data flow and acceptance criteria; inspect docs.
- [x] 03 Sources: academic.json and jobs.json with stable IDs and a realistic week; JSON parse and ID checks.
- [x] 04 Context/validation: AGENTS.md, context/*.md, src/lib/schema.ts and dates.ts; tests reject bad references, invalid dates and DST errors.
- [x] 05 Skill/launcher: .claude/skills/morning-check-in/SKILL.md and scripts/planner.mjs; verify tools/arguments, explicit context and skill metadata.
- [x] 06 Protection: .claude/settings.json and scripts/protect-data.mjs; test blocked edits, overwrite, traversal, symlinks, malformed hook input and allowed plans/notes.
- [x] 07 API/polling: src/lib/store.ts, GET /api/dashboard and client polling; temp-directory tests for missing/malformed data and fresh reads.
- [x] 08 UI: responsive daily overview, schedule, priorities, deadlines, jobs/prep, timestamps and states; build and visual browser inspection.
- [x] 09 Integration: real CLI skill, confirmation/refusal and hook checks; browser refresh and responsiveness; record actual evidence and limitations.
- [x] 10 Delivery: README, demo script and final verification report; full npm check, final review, remote consistency.

Tests precede behavior implementation. Contracts: schemas are exported by schema.ts;
chicagoDate(now) and validDate(input) by dates.ts; loadDashboard(root,date) by
store.ts; hook reads JSON stdin and emits a PreToolUse decision. GET accepts only
an optional valid calendar date, never filesystem paths. Tests use isolated temp
fixtures and never mutate protected sources or fabricate confirmed user plans.
