> Historical browser-primary mode. Current assignment/native evidence is in ../verification.md.

# Calendar-first verification — November 9, 2026

- 37 unit/security tests pass, including calendar dates across DST/year boundaries,
  seven-day saved-plan reads, fixed-event deduplication, preview replacement,
  overlap lanes and current completion/manual task-state precedence.
- 16 browser tests pass: nonmodal assistant beside the calendar, real event pixel
  placement, Day/Week/date navigation, overlap details, in-calendar unsaved preview,
  refusal and explicit confirmation, immediate confirmed refresh, stale-week recovery,
  phone Day view and all preserved task/chat regression behavior.
- TypeScript, production build and formatting pass. Source hashes below are unchanged.
- Fresh before captures show the former board and blocking modal; current captures
  show the actual calendar and persistent panel. An event-position arithmetic bug
  found visually was corrected and covered by a browser position assertion.
- Independent review found completion-state and selected-day detail inconsistencies.
  Calendar entries now use task-board precedence and day changes clear unrelated
  details. Native account bridge and confirmation enforcement remain unchanged.

Current captures: images/calendar-workspace.png, images/calendar-assistant.png,
images/calendar-mobile.png and images/calendar-assistant-mobile.png. Before captures
are local under artifacts/calendar-before. Visual review is not a claim of full
accessibility compliance; key labels, keyboard navigation and error states are tested.

## Earlier browser-bridge acceptance evidence

### Browser Codex verification — November 9, 2026

Browser planning is now the primary workflow. Prior terminal-only reports are
archived; their pending connection results do not describe this successful run.

## Real model evidence

The actual Codex app-server bridge, using its existing ChatGPT login and configured
model, returned a morning question. A real browser at localhost:3000 then sent
Good morning and received an actual context-aware reply naming Algorithms at
10:30–11:50. Screenshots in images/browser-planner.png and browser-planner-mobile.png
show that real conversation, not a mocked response.

`node scripts/verify-browser-live.mjs` completed successfully in a disposable fixture:

| Step                  | Actual result                                                          |
| --------------------- | ---------------------------------------------------------------------- |
| Good morning          | Questions about energy and 09–18 availability around Algorithms.       |
| Answer                | Validated proposal with 13 time blocks; no plan or notes file created. |
| Refusal               | Draft discarded; generated plan and memory still absent.               |
| Revision              | New validated proposal; confirming the old ID was rejected.            |
| Explicit confirmation | Plan and notes saved with matching actual timestamp.                   |
| Source integrity      | Both source hashes remained unchanged.                                 |

Confirmation timestamp: `2026-11-09T06:29:08.081Z` (00:29 Chicago).
Machine-readable local evidence: artifacts/browser-live-verification.json (gitignored).
The script removes its fixture, and no test plan is installed as the owner's real day.

An initial native request exposed a strict structured-output schema requirement:
every property must be required. Optional block sourceId was replaced by a required
nullable value in the model contract, normalized to omission for saved breaks.
The corrected real flow above passed. Earlier terminal-mode connection failures
remain historical facts, not current evidence that browser planning is offline.

## Automated checks

- 32 unit/security tests pass: original dates/DST/schema/source protection/API and
  completion behavior, plus browser draft/refusal/revision/idempotent confirmation,
  invalid model output, same-origin/body restrictions and protocol/login checks.
- 12 Playwright tests pass, including direct browser conversation, draft preview,
  refusal, explicit confirmation, state restoration, phone/desktop layout,
  signed-out UI, input retention on failure and original board features.
- Browser regression model replies are mocked to avoid account use; real-model
  coverage is separately recorded above. These are distinct verification paths.
- TypeScript, production build and formatting pass. Source files retain their
  original SHA-256 values.
- Independent review found stale UI callbacks and an unhandled stdin pipe error;
  date-keyed remount/request generations and a pipe error handler address them.

## Enforcement and limits

The browser AI thread is read only with shell/MCP/plugins/subagents/web disabled.
The host rejects interactive tool requests and API-key authentication. A guarded
same-origin confirmation endpoint accepts only a server-held draft ID, validates
again and writes plan then notes atomically per file. Plain model text cannot save.

No claim is made that this chat and the local account share a single usage pool.
The bridge uses the local ChatGPT-authenticated Codex allowance. Model messages
consume account usage; opening the panel, confirming or discarding does not.
Conversation drafts expire after idle timeout/server restart; saved files remain.

Native terminal hook model-integration was not rerun for this change. Browser mode
does not use an AI file-write hook as its primary saving boundary. The owner knowingly
chose Codex despite the original assignment's Claude Code requirement.

## Protected hashes

- academic.json: `2705c5366bf93c6b2c1665846eed64dade7ccc65984e2e6f692aaf45efc39463`
- jobs.json: `ddac94ecf6b2da0fdfed1d1336f5a03f6b0d888e8be6e40eaeb8735a55f21bbe`

## Task-card clipping regression

Task cards were shrinking to about 24px inside the fixed-height desktop list,
while their content needed about 200px. Cards now retain their natural height
and the list scrolls. Removed the zero minimum-height override, corrected stale
calendar-layout selectors to the actual board/list classes, and let narrow action
rows wrap. A geometry regression checks all 12 cards and action controls at widths
1440, 1024, 900, 768, 760, 390 and 320px, plus reaching the final task by scrolling.
