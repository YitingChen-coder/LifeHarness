---
name: morning-check-in
description: Use when the user says good morning, plan my day, morning check-in, help me prioritize today, or asks to revise or complete tasks in their daily LifeHarness plan.
allowed-tools: Read Glob Grep Write
---

# Morning check-in

Help the user choose a realistic day. Proposals are not permission to save.

1. Use the launch context's planning date and America/Chicago timezone. If no
   launch date is available, ask for today's date; do not guess from sample files.
2. Read both data/sources/academic.json and data/sources/jobs.json. Use Glob to
   find data/generated/notes.json and previous dated plans; read the latest prior
   plan and today's plan when present. Missing notes mean this is a first check-in.
   Read context/planning.md for reference when needed. If a source is missing or
   malformed, say what you cannot see and stop before proposing a saved plan.
3. Recap unfinished work using confirmed plans/notes, not invented memories. Ask
   one or two relevant questions about available time, energy or changed priorities.
   Wait for the answers. Keep the first reply short and do not write files.
4. Propose 2–4 priorities with reasons and a timed schedule. Preserve all fixed
   events, flag any conflicts, protect lunch, allow buffers and carry work forward
   when it does not fit. Mention imminent deadlines and interview preparation.
   Distinguish suggested follow-ups from messages actually sent (none are sent).
5. Ask explicitly whether to save this plan. Wait for a subsequent clear agreement
   to the displayed proposal. “Looks good, save it” is agreement; silence, “show
   me”, “not yet” and new requirements are not. A changed proposal needs agreement
   again. If the user declines, write nothing, including notes.
6. Only after agreement, read context/output-format.md and src/lib/schema.ts, then
   use Write for the complete data/generated/YYYY-MM-DD.json. Use the latest UserPromptSubmit clock
   timestamp, not the launch time or demo date, for confirmedAt. Include source IDs and statuses;
   preserve existing completed work unless the user explicitly changes it.
7. After the plan write succeeds, Write data/generated/notes.json with confirmed
   carryover and factual reflections. If either write fails, explain exactly which
   file saved and which did not; do not bypass the hook or claim full success.
8. Tell the user the plan was saved and the dashboard will refresh within five
   seconds. You cannot move real events, alter source files, send emails, apply
   to jobs or perform Git operations. Offer suggestions the user can act on.

## Example

User: Good morning.
Read sources and prior notes, then ask: “Your demo is due at 5:30 and your technical
interview is tomorrow. How much uninterrupted time do you have this morning?”
After the answer, propose a realistic plan and ask to save. Write only after the
next explicit agreement. If asked “move my class”, explain the fixed-event conflict
and refuse to alter protected data; an explicit request does not override the hook.
