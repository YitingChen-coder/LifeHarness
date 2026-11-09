# Calendar-first workspace

User requests a right-side conversation panel and a calendar that shows the actual
schedule directly. Keep the established violet/neutral system, English interface
and functioning Codex account integration. This is an implementation correction,
not a new concept-selection exercise.

Use the calendar as the default workspace, with Day/Week controls, Today, date
navigation, hour grid, clear course/interview/focus colors and readable times.
Load all seven confirmed days so changing the selected day never hides other saved
plans. Source fixed events remain visible without any confirmed AI plan. Place
concurrent events side by side, visibly flag overlaps and retain out-of-hours events.
Keep deadlines in a separate row; never invent task time blocks from due dates.

Keep Codex as a persistent desktop right panel, no dialog/backdrop. The calendar
remains usable during conversation. On narrow screens, stack the assistant below
calendar and offer a direct scroll button. Do not squeeze a week into unreadable
phone columns: allow internal horizontal scrolling and a Day option.

Show validated selected-day proposals as dashed task blocks before saving, labeled
Draft—not saved; fixed commitments retain their normal style. Replace that day’s
older planned tasks in preview, rather than showing two competing schedules.
Only explicit confirmation persists. On save refresh calendar immediately, while
regular polling still sees external changes. Keep tasks, search, status and focus
work as a secondary Tasks tab; preserve Career and task details.

Reduce header duplication and technical text. Keep date, key view navigation and
assistant actions visible; put account/privacy detail behind disclosure. Use one
scroll area for the panel’s conversation/proposal and keep the composer reachable.

Checkpoints: calendar model/read API with meaningful time/overlap tests; upload.
Calendar and persistent panel plus preview integration, responsive UI tests; upload.
Visual checks, documentation and independent review; upload.

Evidence: fresh before/after screenshots; confirm schedules across days, overlaps,
Chicago DST dates, draft-vs-confirmed states and automatic refresh. Keep model calls
out of routine UI tests; the existing native integration is unchanged.
