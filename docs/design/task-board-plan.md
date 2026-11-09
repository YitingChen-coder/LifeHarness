# Task board redesign — selected visual 3

User selected the third displayed concept (Focus Lane). Preserve existing Next.js,
Claude harness, protected source files and confirmation flow; implement the selected
violet/graphite task board instead of the rejected pale dashboard. No deployment.

## Delivery checkpoints

1. Task model and persistence: three statuses (todo, in_progress, done), real source
   IDs, validated local state under data/user/task-state.json; search/domain filters,
   due sorting and completed-plan reconciliation. Test model, atomic persistence,
   concurrent changes and unsafe path/ID rejection; upload.
2. UI and interactions: graphite 88px rail, readable 15px+ body, violet focus strip,
   three kanban columns, pointer drag and accessible status selector, task details,
   25-minute timer with pause/reset, searchable filters, actual selected-day schedule
   drawer and honest Claude terminal instructions with copy action. Upload.
3. Verification and handoff: updated browser tests, reference comparison at
   1487x1058, phone checks, source integrity, README/demo and design-qa.md. Upload.

## Decisions

Task status changes are explicit human actions persisted independently of protected
sources and confirmed AI plans. The new POST endpoint accepts only a known task ID
and status, requires same-origin loopback JSON requests and never takes a path.
Writes serialize and replace the state file atomically. A newer manual state wins
over an older confirmed plan; a newly confirmed plan can mark tasks done. Statuses
apply across dates. Claude reads this state as protected input at each check-in.
Focus timing stays in browser storage, uses an absolute deadline to avoid interval
drift, survives reload, and never auto-completes a task. No model gateway or fake
chat: Plan with Claude opens correct-date launcher instructions and copies the command.
No fabricated done/in-progress states are seeded to imitate the concept image.

## Acceptance

- Source hashes unchanged when statuses move; saved status survives reload.
- Search/filter counts and visible cards agree; no inaccessible sliced tasks.
- Drag, keyboard selector and touch-friendly buttons all work.
- Timer pause/resume/reset and reload are deterministic under fake-clock tests.
- Schedule and confirmed plan still refresh from local files every three seconds.
- Stale/error states remain honest; small screens have no page overflow.
