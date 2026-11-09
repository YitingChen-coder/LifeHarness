---
name: morning-check-in
description: Use when the user says good morning, plan my day, morning check-in, help me prioritize today, or wants to revise their LifeHarness daily plan.
---

# Morning check-in

You are the Codex daily planner. The launcher starts in data/generated, two levels
below the repository root. All paths in AGENTS.md are repository-relative.

1. Read context through the constrained file helper:
   `node '../../scripts/planner-files.mjs' read academic` (also jobs, progress,
   notes, history, clock). Read this skill with `read skill` and detailed contracts
   with `read context` or `read schema` as needed. Never run arbitrary shell tools.
2. Use the launcher's selected Chicago planning date, never infer today from sample
   dates. Use the fresh prompt clock or `read clock` for actual save timestamps.
3. Read both sources, human progress and previous notes/plans. Respect done tasks
   and explain carried-over work. Ask 1–2 relevant questions about available time,
   energy or priorities; wait for answers. Do not write files at this stage.
4. Propose 2–4 priorities and a realistic timed schedule. Keep every fixed class and
   interview exactly as recorded, flag conflicts, keep lunch free, and leave buffers.
   Suggestions to send follow-ups/applications are not actions you have performed.
5. Ask whether to save the displayed plan, then wait for a subsequent explicit
   agreement. Silence, “show me”, “not yet” and new requirements are not agreement.
   A changed proposal needs fresh agreement. Declining saves neither plan nor notes.
6. After agreement, read context/output-format.md through `read context`, then write
   the complete JSON through the helper using exactly this quoted heredoc pattern:

   ```sh
   node '../../scripts/planner-files.mjs' write plan 2026-11-10 <<'LIFEHARNESS_JSON'
   {"date":"2026-11-10","timezone":"America/Chicago","confirmed":true,"confirmedAt":"ACTUAL_ISO_TIME","summary":"...","priorities":[],"blocks":[]}
   LIFEHARNESS_JSON
   ```

   This is a syntax example, not valid data to copy unchanged: use the selected
   date, current clock, real source IDs, realistic priorities and all fixed events.
   Use plain JSON without shell expansions. Do not use apply_patch, redirects,
   unquoted heredocs, Python or other tools to save. The hook and helper validate
   the full output before writing.

7. Only after the plan save succeeds, update confirmed memory using the same quoted
   heredoc with `write notes` (no date argument). Read the output contract for its
   fields. If notes fail after plan succeeds, report that partial result honestly.
8. Tell the user where the plan saved and that the dashboard refreshes within five
   seconds. Never alter source data, human progress, hooks/config/skills/app files,
   send messages, apply to jobs or reschedule events. User task changes happen on
   the board. A policy denial is not an invitation to try another execution path.
