# LifeHarness architecture

LifeHarness is a local-first planning harness for MPCS 51238 Assignment 6.
Claude Code is the planner; Next.js is a read-only view. No database, login,
cloud deployment, external calendar write access, or embedded chat is required.

## Boundaries

| Area | Responsibility | Planner access |
| --- | --- | --- |
| data/sources | Synthetic academic and job-search records | Read only |
| AGENTS.md, context | Short standing rules and on-demand references | Read only |
| .claude, scripts | Discoverable morning skill and safety enforcement | Read only |
| data/generated | Confirmed daily plans and notes | Read/write, validated by hook |
| src/app, src/lib | Dashboard, GET API, schema and date handling | Read only |

Sources → Claude reads sources and notes → asks 1–2 questions → proposes a
schedule → waits for explicit agreement → writes a dated plan and notes →
Dashboard polls the GET endpoint every three seconds. No writes before agreement.
A changed plan is a new proposal and requires fresh agreement.

## Daily planning defaults

America/Chicago; task blocks between 09:00 and 18:00; lunch 12:00–13:00 stays free.
Fixed classes/interviews remain fixed. Prioritize hard deadlines, interviews,
then focused study and applications. Surface conflicting fixed events instead
of moving them or pretending they fit. Carry over unfinished work.

## Safety boundary

The dedicated planner launcher exposes only Read, Glob, Grep, Write, Edit and
Skill. A wildcard PreToolUse hook denies all other tools, validates canonical
paths, and allows writes only to known generated plan/note filenames. The
planner cannot change its hook, settings, source data or app. Development and
Git operations happen outside that planner session. This is a tool boundary,
not an OS sandbox against the computer owner or unrelated external programs.
User confirmation is a conversational rule; the hook enforces paths and schemas,
not an independent semantic proof of agreement.

AGENTS.md is explicitly appended by the launcher, never assumed auto-loaded.
No CLAUDE.md is used. Verify the actual session using /context. Skills and hooks
remain enabled. A normal unrestricted `claude` launch is not the supported mode.

## Read interface

GET /api/dashboard?date=YYYY-MM-DD defaults to today's Chicago date. It returns
validated source records, the selected date's confirmed plan if present, and
separate warnings for missing/invalid files. Non-GET writes are unsupported.
The API reads files afresh and disables HTTP caching. The browser retains its
last successful result if a subsequent fetch fails and labels it stale.
Demo mode explicitly selects 2026-11-10; it never silently changes today's date.
